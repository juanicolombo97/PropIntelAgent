import os
from fastapi import APIRouter, Form, Request
from fastapi.responses import PlainTextResponse, JSONResponse

from services.dynamo import (
    put_message, get_lead, update_lead, t_props, query_messages, create_visit,
    get_conversation_history, get_property_by_context, get_stage_appropriate_context,
    update_lead_stage_and_status, update_qualification_data
)
from services.ai import (
    extract_slots, parse_visit_datetime, format_datetime_for_user, 
    generate_stage_based_response, get_property_by_url
)
from services.matching import find_matches, format_props_sms, props_ids
from models.schemas import (
    merge_profile, qualifies, next_question, dec_to_native,
    set_last_suggestions, choose_property_from_reply,
    set_stage_awaiting_date, clear_stage
)

router = APIRouter()

@router.post("/webhook")
async def webhook(request: Request, From: str = Form(...), Body: str = Form(...)):
    """
    Endpoint principal del webhook - Bot inmobiliario con sistema de colas SQS.
    """
    try:
        lead_id = From.strip()  # Limpiar espacios del lead_id
        message_text = Body.strip() if Body else ""
        
        if not message_text:
            return PlainTextResponse(
                "<Response><Message><ERRORRRR</Message></Response>",
                media_type="application/xml"
            )
        
        print(f"📱 Webhook con cola: {lead_id} -> '{message_text}'")
        
        # Detectar si viene del Lambda Processor
        is_from_processor = request.headers.get('X-From-Processor') == 'true'
        
        # Guardar mensaje SOLO si NO viene del processor (evitar duplicados)
        if not is_from_processor:
            put_message(lead_id, message_text, direction="in")
        else:
            print(f"🔄 Mensaje del Lambda Processor, no guardando entrada")
        
        # Si NO viene del processor, enviar a cola SQS
        if not is_from_processor:
            from services.message_queue import send_message_to_queue
            
            queue_enabled = os.getenv('MESSAGE_QUEUE_URL') is not None
            
            if queue_enabled:
                # Para colas Standard, el batching lo maneja el trigger (Maximum batching window)
                # Enviar sin delay para permitir la agregación de mensajes
                queue_success = send_message_to_queue(lead_id, message_text, delay_seconds=0)
                
                if queue_success:
                    print(f"📦 Mensaje enviado a cola, procesamiento diferido")
                    # Respuesta vacía a WhatsApp (evita timeout)
                    return PlainTextResponse("<Response></Response>", media_type="application/xml")
                else:
                    print(f"⚠️ Cola no disponible, procesando directamente")
        else:
            print(f"🔄 Mensaje del processor, procesando directamente (no enviando a cola)")
        
        # Procesamiento directo (viene del processor o fallback)
        response = process_lead_message(lead_id, message_text)
        return PlainTextResponse(f"<Response><Message>{response}</Message></Response>", media_type="application/xml")
    
    except Exception as e:
        print(f"❌ ERROR webhook con cola: {e}")
        error_msg = "Disculpá, tuve un problema técnico. Por favor intentá nuevamente."
        return PlainTextResponse(f"<Response><Message>{error_msg}</Message></Response>", media_type="application/xml")
    
def process_lead_message(lead_id: str, message_text: str) -> str:
    """
    Procesa un mensaje de lead (usado por el Lambda Processor).
    """
    try:
        # 1. Obtener/crear lead
        lead = get_lead(lead_id)
        print(f"📊 Lead: {lead.get('Stage', 'N/A')} - {lead.get('Status', 'N/A')}")
        
        # 2. Extraer datos básicos del mensaje
        slots = extract_slots(message_text)
        if any(slots.values()):
            update_data = {}
            for key in ["intent", "rooms", "budget", "neighborhood"]:
                if slots.get(key) is not None:
                    update_data[key.capitalize()] = slots[key]
            
            if update_data:
                update_lead(lead_id, update_data)
                for k, v in update_data.items():
                    lead[k] = v
                print(f"📝 Datos actualizados: {update_data}")
        
        # 3. FLUJO ESPECIAL: URL de propiedad detectada
        property_from_url = get_property_by_url(message_text)
        if property_from_url and not lead.get("PropertyId"):
            property_id = property_from_url.get("PropertyId")
            print(f"🔗 Propiedad por URL: {property_id}")
            
            update_lead_stage_and_status(lead_id, "CALIFICACION", "CALIFICANDO", {"PropertyId": property_id})
            update_qualification_data(lead_id, {"property_confirmed": True})
            
            prop_title = property_from_url.get("Title", "Sin título")
            reply_text = f"Perfecto! Tengo la propiedad: {prop_title}. Ahora necesito hacerte unas preguntas rápidas. Es para vos o para alguien más?"
            put_message(lead_id, reply_text, direction="out")
            send_whatsapp_message(lead_id, reply_text)
            return reply_text
        
        # 4. FLUJO ESPECIAL: Agendamiento de visita
        if lead.get("Stage") == "POST_CALIFICACION" and lead.get("Status") == "AGENDANDO_VISITA":
            date_data = parse_visit_datetime(message_text)
            visit_iso = date_data.get("iso")
            
            if visit_iso:
                property_id = lead.get("PropertyId")
                if property_id:
                    notes = f"Visita WhatsApp Bot - Lead: {lead_id}"
                    create_visit(lead_id, property_id, visit_iso, notes)
                    update_lead_stage_and_status(lead_id, "FINALIZADO", "PROCESO_COMPLETADO")
                    
                fecha_str = format_datetime_for_user(visit_iso)
                reply_text = f"¡Listo! Visita agendada para {fecha_str}. Te confirmaremos los detalles a la brevedad. ¡Gracias!"
                put_message(lead_id, reply_text, direction="out")
                send_whatsapp_message(lead_id, reply_text)
                return reply_text
            else:
                reply_text = "Disculpá, no pude entender la fecha u hora. Por favor indicame un día y horario (ej: viernes 15hs o mañana 10:00)."
                put_message(lead_id, reply_text, direction="out")
                send_whatsapp_message(lead_id, reply_text)
                return reply_text
        
        # 5. FLUJO PRINCIPAL: Generar respuesta usando sistema de etapas
        conversation_history = get_stage_appropriate_context(lead_id, lead.get("Stage", "PRECALIFICACION"))
        
        print(f"💬 Contexto: {len(conversation_history)} mensajes para etapa {lead.get('Stage', 'PRECALIFICACION')}")
        
        response = generate_stage_based_response(lead, conversation_history, message_text)
        
        if response is None:
            response = "Disculpá, tuve un inconveniente técnico. Por favor intentá nuevamente en unos minutos."
        
        put_message(lead_id, response, direction="out")
        send_whatsapp_message(lead_id, response)
        print(f"✅ Respuesta: {response[:100]}...")
        
        return response
        
    except Exception as e:
        print(f"❌ ERROR process_lead_message: {e}")
        import traceback
        print(f"❌ TRACE: {traceback.format_exc()}")
        return "Disculpá, tuve un problema técnico. Por favor intentá nuevamente."

def send_whatsapp_message(lead_id: str, message: str):
    """
    Envía mensaje a WhatsApp usando Twilio (implementar según tu setup).
    """
    try:
        # AQUÍ VAS A PONER TU LÓGICA PARA ENVIAR A WHATSAPP
        print(f"📤 [PLACEHOLDER] Mensaje enviado a WhatsApp {lead_id}: {message[:100]}...")
    except Exception as e:
        print(f"❌ Error enviando WhatsApp: {e}")