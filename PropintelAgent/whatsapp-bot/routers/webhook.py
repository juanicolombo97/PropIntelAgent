from fastapi import APIRouter, Form
from fastapi.responses import PlainTextResponse, JSONResponse

from services.dynamo import (
    put_message, get_lead, update_lead, t_props, query_messages, create_visit,
    get_conversation_history, get_property_by_context
)
from services.ai import extract_slots, parse_visit_datetime, format_datetime_for_user, generate_agent_response, get_filtered_properties
from services.matching import find_matches, format_props_sms, props_ids
from models.schemas import (
    merge_profile, qualifies, next_question, dec_to_native,
    set_last_suggestions, choose_property_from_reply,
    set_stage_awaiting_date, clear_stage
)

router = APIRouter()

# ============================================================================
# FUNCIONES LEGACY - Ya no se usan, el bot ahora usa IA conversacional
# Se mantienen para endpoints del panel admin si es necesario
# ============================================================================

def build_reply_qualified_legacy(lead: dict, last_text: str) -> str:
    """LEGACY - Solo para compatibilidad con endpoints del panel"""
    props = find_matches(lead, t_props, limit=3)
    if props:
        listado = format_props_sms(props)
        return f"Propiedades encontradas:\n{listado}"
    return "No hay propiedades disponibles en este momento."

def build_reply_legacy(lead: dict, last_text: str) -> str:
    """LEGACY - Solo para compatibilidad con endpoints del panel"""
    if lead.get("Missing"):
        return next_question(lead)
    if qualifies(lead):
        return build_reply_qualified_legacy(lead, last_text)
    return "Gracias por la información. Te contactaremos pronto."

@router.post("/webhook")
async def webhook(From: str = Form(...), Body: str = Form(...)):
    """
    Endpoint principal del webhook - Bot inmobiliario inteligente.
    Procesa el mensaje entrante y genera una respuesta del agente Gonzalo.
    """
    try:
        lead_id = From
        message_text = Body.strip() if Body else ""
        
        # Validar que el mensaje no esté vacío
        if not message_text:
            return PlainTextResponse(
                "<Response><Message>Hola! Soy Gonzalo de Compromiso Inmobiliario. Como puedo ayudarte hoy?</Message></Response>",
                media_type="application/xml"
            )
        
        # Guardar mensaje entrante del cliente
        put_message(lead_id, message_text, direction="in")
        
        # Obtener (o crear) el perfil del lead
        lead = get_lead(lead_id)
        
        # Extraer información estructurada del mensaje (intención, ambientes, presupuesto, barrio)
        slots = extract_slots(message_text)
        lead = merge_profile(lead, slots)
        
        # Si se obtuvieron datos nuevos, actualizar al lead en la base (Intent, Rooms, Budget, Neighborhood, Status)
        if any(slots.values()):
            update_data = {}
            if slots.get("intent"):
                update_data["Intent"] = slots["intent"]
            if slots.get("rooms") is not None:
                update_data["Rooms"] = slots["rooms"]
            if slots.get("budget") is not None:
                update_data["Budget"] = slots["budget"]
            if slots.get("neighborhood"):
                update_data["Neighborhood"] = slots["neighborhood"]
            # Determinar estatus (QUALIFIED si cumple datos críticos mínimos)
            update_data["Status"] = "QUALIFIED" if qualifies(lead) else "NEW"
            update_lead(lead_id, update_data)
            # Reflejar cambios en el objeto lead local
            for k, v in update_data.items():
                lead[k] = v
        
        # *** Flujo 0: Enviar mensajes pendientes si los hay ***
        if lead.get("PendingMessages"):
            pending_messages = lead.get("PendingMessages", [])
            if pending_messages:
                # Enviar el siguiente mensaje pendiente
                next_message = pending_messages.pop(0)
                put_message(lead_id, next_message, direction="out")
                
                # Actualizar la lista de mensajes pendientes
                if pending_messages:
                    update_lead(lead_id, {"PendingMessages": pending_messages})
                else:
                    update_lead(lead_id, {"PendingMessages": None})
                
                return PlainTextResponse(f"<Response><Message>{next_message}</Message></Response>", media_type="application/xml")
        
        # Obtener el historial de conversación formateado (últimos 20 mensajes)
        conversation_history = get_conversation_history(lead_id, limit=20)
        
        # Intentar identificar si el mensaje menciona una propiedad específica (por título, barrio u otros identificadores)
        property_context = get_property_by_context(lead, message_text)
        
        # *** Flujo 0: Esperando confirmación de propiedad ***
        if lead.get("Stage") == "AWAITING_PROPERTY_CONFIRMATION" and lead.get("PendingPropertyId"):
            # Cliente confirma o rechaza la propiedad
            if any(word in message_text.lower() for word in ["si", "sí", "si!", "correcto", "exacto", "esa es", "perfecto"]):
                # Confirmó la propiedad - continuar con precalificación
                print(f"✅ Cliente confirmó la propiedad {lead.get('PendingPropertyId')}")
                # No limpiar PendingPropertyId, pero cambiar Stage para continuar con precalificación
                update_lead(lead_id, {"Stage": None})  # Volver a conversación normal pero con propiedad confirmada
                reply_text = "Perfecto! Es para vos o para alguien más?"
                put_message(lead_id, reply_text, direction="out")
                return PlainTextResponse(f"<Response><Message>{reply_text}</Message></Response>", media_type="application/xml")
            elif any(word in message_text.lower() for word in ["no", "no es", "otra", "diferente"]):
                # Rechazó la propiedad - volver a buscar
                print(f"❌ Cliente rechazó la propiedad {lead.get('PendingPropertyId')}")
                clear_stage(lead)
                update_lead(lead_id, {"Stage": None, "PendingPropertyId": None})
                reply_text = "Entiendo. Me podés dar más detalles de la propiedad que buscás? Título completo o link?"
                put_message(lead_id, reply_text, direction="out")
                return PlainTextResponse(f"<Response><Message>{reply_text}</Message></Response>", media_type="application/xml")
            # Si no es clara la respuesta, seguir esperando
            reply_text = "Necesito que me confirmes: es esta la propiedad que te interesa? (Si/No)"
            put_message(lead_id, reply_text, direction="out")
            return PlainTextResponse(f"<Response><Message>{reply_text}</Message></Response>", media_type="application/xml")
        
        # *** Flujo 1: Coordinación de visita - esperando fecha/hora del cliente ***
        if lead.get("Stage") == "AWAITING_DATE" and lead.get("PendingPropertyId"):
            # Si el cliente responde negativamente en lugar de dar una fecha (ej: "no", "más adelante")
            if message_text.lower().startswith("no"):
                clear_stage(lead)  # limpiar estado de espera
                update_lead(lead_id, {"Stage": None, "PendingPropertyId": None})
                reply_text = "Entiendo. No te preocupes, podemos coordinar en otro momento. Cualquier otra consulta, estoy a tu disposición."
                # Guardar respuesta del agente y retornar
                put_message(lead_id, reply_text, direction="out")
                return PlainTextResponse(f"<Response><Message>{reply_text}</Message></Response>", media_type="application/xml")
            # Intentar interpretar la fecha/hora proporcionada por el cliente
            date_data = parse_visit_datetime(message_text)
            visit_iso = date_data.get("iso")
            if visit_iso:
                # Crear notas automáticas con información del lead
                notes_parts = []
                if lead.get("Neighborhood"):
                    notes_parts.append(f"Barrio: {lead.get('Neighborhood')}")
                if lead.get("Rooms"):
                    notes_parts.append(f"Ambientes: {lead.get('Rooms')}")
                if lead.get("Budget"):
                    notes_parts.append(f"Presupuesto: ${lead.get('Budget'):,}")
                if lead.get("Intent"):
                    notes_parts.append(f"Intención: {lead.get('Intent')}")
                
                notes = f"Visita solicitada por WhatsApp Bot. " + " | ".join(notes_parts) if notes_parts else "Visita solicitada por WhatsApp Bot"
                
                # Crear registro de la visita en DynamoDB (estado pendiente de confirmación)
                create_visit(lead_id, lead["PendingPropertyId"], visit_iso, notes)
                # Limpiar el estado de espera en el lead
                clear_stage(lead)
                update_lead(lead_id, {"Stage": None, "PendingPropertyId": None})
                # Formatear la fecha para la respuesta al cliente
                fecha_str = format_datetime_for_user(visit_iso)
                reply_text = f"¡Listo! He registrado tu solicitud de visita para {fecha_str}. Te confirmaremos los detalles a la brevedad. ¡Gracias!"
            else:
                # No se entendió la fecha; pedir al cliente que reintente con otro formato
                reply_text = ("Disculpá, no pude entender la fecha u hora que mencionaste. "
                              "Por favor indicame un día y horario para la visita (por ej.: viernes 15hs o mañana 10:00).")
            # Guardar respuesta del agente y retornar
            put_message(lead_id, reply_text, direction="out")
            return PlainTextResponse(f"<Response><Message>{reply_text}</Message></Response>", media_type="application/xml")
        
        # *** Flujo 2: Cliente elige una propiedad sugerida por número/ID ***
        chosen_property_id = choose_property_from_reply(lead, message_text)
        if chosen_property_id:
            # Configurar estado de espera de fecha para la propiedad elegida
            set_stage_awaiting_date(lead, chosen_property_id)
            update_lead(lead_id, {"Stage": "AWAITING_DATE", "PendingPropertyId": chosen_property_id})
            # Obtener detalles básicos de la propiedad (para referencia en la respuesta)
            prop_item = t_props.get_item(Key={"PropertyId": chosen_property_id}).get("Item")
            neighborhood = prop_item.get("Neighborhood") if prop_item else None
            prop_ref = f"la propiedad en {neighborhood}" if neighborhood else "esa propiedad"
            reply_text = f"¡Excelente elección! Vamos a coordinar una visita para {prop_ref}. Que día y horario te gustaría ir a verla?"
            # Guardar respuesta del agente y retornar
            put_message(lead_id, reply_text, direction="out")
            return PlainTextResponse(f"<Response><Message>{reply_text}</Message></Response>", media_type="application/xml")
        
        # *** Flujo 3: Verificar si todos los datos están completos para agendamiento automático ***
        # Verificar si el lead ya tiene propiedad confirmada y todos los datos necesarios
        if lead.get("PendingPropertyId") and lead.get("Stage") != "AWAITING_DATE":
            # Verificar datos de precalificación en el historial
            buyer_confirmed = any(
                msg.get("role") == "user" and any(word in msg.get("content", "").lower() for word in ["para mi", "para mí", "es mío", "para mia", "mio", "mía"])
                for msg in conversation_history[-10:]
            )
            motive_confirmed = any(
                msg.get("role") == "user" and any(word in msg.get("content", "").lower() for word in ["mudanza", "mudarme", "inversión", "invertir", "inversion", "inversor"])
                for msg in conversation_history[-10:]
            )
            financing_confirmed = any(
                msg.get("role") == "user" and any(word in msg.get("content", "").lower() for word in ["ahorro", "crédito", "efectivo", "financio", "banco", "tengo", "suficiente"])
                for msg in conversation_history[-10:]
            ) or lead.get("Budget")
            ready_to_close = any(
                msg.get("role") == "user" and any(word in msg.get("content", "").lower() for word in ["puedo avanzar", "si me gusta", "estoy listo", "podemos coordinar", "quiero comprar", "quiero alquilar", "me interesa"])
                for msg in conversation_history[-5:]
            )
            
            print(f"[DEBUG] Verificando datos completos:")
            print(f"   buyer_confirmed: {buyer_confirmed}")
            print(f"   motive_confirmed: {motive_confirmed}")
            print(f"   financing_confirmed: {financing_confirmed}")
            print(f"   ready_to_close: {ready_to_close}")
            
            if buyer_confirmed and motive_confirmed and financing_confirmed and ready_to_close:
                print(f"🚀 TODOS LOS DATOS COMPLETOS - FORZANDO AGENDAMIENTO")
                set_stage_awaiting_date(lead, lead["PendingPropertyId"])
                update_lead(lead_id, {"Stage": "AWAITING_DATE"})
                reply_text = "Perfecto! Que día y horario te conviene para la visita?"
                put_message(lead_id, reply_text, direction="out")
                return PlainTextResponse(f"<Response><Message>{reply_text}</Message></Response>", media_type="application/xml")
        
        # (Sin flujo de ofertas/sugerencias automáticas: el LLM decide qué decir en base al prompt)
        
        # *** Flujo 4: Conversación general (aún faltan datos o uso de IA para responder) ***
        response = generate_agent_response(
            conversation_history=conversation_history,
            lead_data=lead,
            property_context=property_context
        )
        
        # Si no hay respuesta (API falló), no responder nada
        if response is None:
            return PlainTextResponse("", media_type="application/xml")
        
        # *** DETECCIÓN AUTOMÁTICA: Si el LLM pregunta por confirmación de propiedad ***
        property_confirmation_keywords = ["es esta la propiedad", "te interesa", "es esta", "es la que buscas"]
        
        print(f"🔍 Verificando detección...")
        print(f"   Respuesta: {response[:100] if response else 'None'}...")
        
        if response and any(keyword in response.lower() for keyword in property_confirmation_keywords):
            print(f"✅ DETECTADO pregunta de confirmación de propiedad!")
            
            available_props = get_filtered_properties(lead)
            if len(available_props) == 1 and lead.get("Stage") != "AWAITING_PROPERTY_CONFIRMATION":
                property_id = available_props[0].get("PropertyId")
                print(f"🔄 SETEANDO Stage=AWAITING_PROPERTY_CONFIRMATION, PropertyId={property_id}")
                update_lead(lead_id, {"Stage": "AWAITING_PROPERTY_CONFIRMATION", "PendingPropertyId": property_id})
                print(f"✅ Lead actualizado para esperar confirmación de propiedad")
        
        # Si el LLM pregunta ESPECÍFICAMENTE por fecha/hora para agendar, setear Stage AWAITING_DATE
        elif response and any(phrase in response.lower() for phrase in ["que día", "qué día", "que dia", "horario te conviene", "cuando te conviene"]):
            # DETECCIÓN ESPECÍFICA: Frases que indican pregunta por fecha de agendamiento
            print(f"✅ DETECTADO pregunta de fecha/horario!")
            
            available_props = get_filtered_properties(lead)
            print(f"   Propiedades disponibles: {len(available_props)}")
            
            if len(available_props) == 1 or lead.get("PendingPropertyId"):
                property_id = lead.get("PendingPropertyId") or available_props[0].get("PropertyId")
                print(f"   PropertyId encontrado: {property_id}")
                print(f"   Stage actual: {lead.get('Stage')}")
                
                if property_id and lead.get("Stage") != "AWAITING_DATE":
                    print(f"🔄 SETEANDO Stage=AWAITING_DATE, PropertyId={property_id}")
                    set_stage_awaiting_date(lead, property_id)
                    update_lead(lead_id, {"Stage": "AWAITING_DATE", "PendingPropertyId": property_id})
                    print(f"✅ Lead actualizado para esperar fecha de visita")
                else:
                    print(f"⚠️ No se setea Stage: property_id={property_id}, current_stage={lead.get('Stage')}")
            else:
                print(f"⚠️ No se puede setear AWAITING_DATE: {len(available_props)} propiedades disponibles")
        else:
            print(f"❌ NO se detectaron palabras especiales")
        
        # Verificar si la respuesta tiene múltiples preguntas y separarlas
        if "?" in response and response.count("?") > 1:
            # Dividir por preguntas y limpiar
            parts = response.split("?")
            messages = []
            for part in parts:
                part = part.strip()
                if part and not part.endswith("."):
                    messages.append(part + "?")
                elif part:
                    messages.append(part)
            
            if len(messages) > 1:
                # Guardar primer mensaje
                first_message = messages[0]
                put_message(lead_id, first_message, direction="out")
                
                # Guardar mensajes restantes para enviar después
                remaining_messages = messages[1:]
                update_lead(lead_id, {"PendingMessages": remaining_messages})
                
                return PlainTextResponse(f"<Response><Message>{first_message}</Message></Response>", media_type="application/xml")
        
        # Respuesta única normal
        put_message(lead_id, response, direction="out")
        return PlainTextResponse(f"<Response><Message>{response}</Message></Response>", media_type="application/xml")
    
    except Exception as e:
        print(f"[WEBHOOK][ERROR] {e}")
        error_msg = ("Disculpa, tuve un inconveniente técnico. "
                     "Por favor intentá nuevamente en unos minutos. "
                     "Si el problema persiste, contactá a nuestro equipo.")
        return PlainTextResponse(f"<Response><Message>{error_msg}</Message></Response>", media_type="application/xml")
    
    
# ---- Endpoints panel ----
@router.get("/lead")
def lead(lead_id: str):
    item = get_lead(lead_id)
    return JSONResponse(dec_to_native(item))

@router.get("/messages")
def messages(lead_id: str, limit: int = 20):
    items = query_messages(lead_id, limit=limit)
    return {"items": dec_to_native(items)}

@router.get("/properties")
def properties(neighborhood: str | None = None, limit: int = 20):
    from boto3.dynamodb.conditions import Attr
    scan_kwargs = {"FilterExpression": Attr("Status").eq("ACTIVE")}
    if neighborhood:
        scan_kwargs["FilterExpression"] = (
            Attr("Status").eq("ACTIVE") & Attr("Neighborhood").eq(neighborhood)
        )
    resp = t_props.scan(**scan_kwargs)
    items = resp.get("Items", [])
    return {"items": dec_to_native(items[:limit])}

# ============================================================================
# FUNCIÓN PARA PRUEBAS LOCALES - LLAMAR DIRECTAMENTE DESDE PYTHON
# ============================================================================

def test_bot_message(phone_number: str, message: str, verbose: bool = True) -> str:
    """
    Función para probar el bot localmente sin necesidad de HTTP.
    Replica exactamente la lógica del webhook usando la base de datos real.
    
    Args:
        phone_number: Número de teléfono (será el lead_id)
        message: Mensaje del usuario
        verbose: Si mostrar información de debug
        
    Returns:
        Respuesta del bot
    """
    try:
        lead_id = phone_number
        message_text = message.strip() if message else ""
        
        if verbose:
            print(f"📱 Procesando mensaje de {lead_id}: '{message_text}'")
        
        # Validar que el mensaje no esté vacío
        if not message_text:
            return "Hola! Soy Gonzalo de Compromiso Inmobiliario. Como puedo ayudarte hoy?"
        
        # Guardar mensaje entrante en la base de datos real
        put_message(lead_id, message_text, direction="in")
        
        if verbose:
            print("✅ Mensaje guardado en DB")

        # Obtener o crear lead desde la base de datos real
        lead = get_lead(lead_id)
        
        if verbose:
            print(f"📊 Lead obtenido: {lead}")
        
        # Extraer información básica del mensaje
        slots = extract_slots(message_text)
        lead = merge_profile(lead, slots)
        
        if verbose:
            print(f"🔍 Slots detectados: {slots}")
        
        # *** Flujo 0: Esperando confirmación de propiedad ***
        if lead.get("Stage") == "AWAITING_PROPERTY_CONFIRMATION" and lead.get("PendingPropertyId"):
            if verbose:
                print(f"🔄 Lead en AWAITING_PROPERTY_CONFIRMATION - procesando confirmación...")
            
            # Cliente confirma o rechaza la propiedad
            if any(word in message_text.lower() for word in ["si", "sí", "si!", "correcto", "exacto", "esa es", "perfecto"]):
                # Confirmó la propiedad - continuar con precalificación
                if verbose:
                    print(f"✅ Cliente confirmó la propiedad {lead.get('PendingPropertyId')}")
                update_lead(lead_id, {"Stage": None})  # Volver a conversación normal pero con propiedad confirmada
                reply_text = "Perfecto! Es para vos o para alguien más?"
                put_message(lead_id, reply_text, direction="out")
                return reply_text
            elif any(word in message_text.lower() for word in ["no", "no es", "otra", "diferente"]):
                # Rechazó la propiedad - volver a buscar
                if verbose:
                    print(f"❌ Cliente rechazó la propiedad {lead.get('PendingPropertyId')}")
                clear_stage(lead)
                update_lead(lead_id, {"Stage": None, "PendingPropertyId": None})
                reply_text = "Entiendo. Me podés dar más detalles de la propiedad que buscás? Título completo o link?"
                put_message(lead_id, reply_text, direction="out")
                return reply_text
            # Si no es clara la respuesta, seguir esperando
            reply_text = "Necesito que me confirmes: es esta la propiedad que te interesa? (Si/No)"
            put_message(lead_id, reply_text, direction="out")
            return reply_text
        
        # *** Flujo 1: Coordinación de visita - esperando fecha/hora del cliente ***
        if lead.get("Stage") == "AWAITING_DATE" and lead.get("PendingPropertyId"):
            if verbose:
                print(f"🔄 Lead en AWAITING_DATE - procesando fecha...")
            
            # Si el cliente responde negativamente en lugar de dar una fecha
            if message_text.lower().startswith("no"):
                clear_stage(lead)
                update_lead(lead_id, {"Stage": None, "PendingPropertyId": None})
                return "Entiendo. No te preocupes, podemos coordinar en otro momento. Cualquier otra consulta, estoy a tu disposición."
            
            # Intentar interpretar la fecha/hora proporcionada por el cliente
            date_data = parse_visit_datetime(message_text)
            visit_iso = date_data.get("iso")
            
            if visit_iso:
                # Crear notas automáticas con información del lead
                notes_parts = []
                if lead.get("Neighborhood"):
                    notes_parts.append(f"Barrio: {lead.get('Neighborhood')}")
                if lead.get("Rooms"):
                    notes_parts.append(f"Ambientes: {lead.get('Rooms')}")
                if lead.get("Budget"):
                    notes_parts.append(f"Presupuesto: ${lead.get('Budget'):,}")
                if lead.get("Intent"):
                    notes_parts.append(f"Intención: {lead.get('Intent')}")
                
                notes = f"Visita solicitada por WhatsApp Bot. " + " | ".join(notes_parts) if notes_parts else "Visita solicitada por WhatsApp Bot"
                
                # Crear registro de la visita en DynamoDB
                create_visit(lead_id, lead["PendingPropertyId"], visit_iso, notes)
                
                # Limpiar el estado de espera en el lead
                clear_stage(lead)
                update_lead(lead_id, {"Stage": None, "PendingPropertyId": None})
                
                # Formatear la fecha para la respuesta al cliente
                fecha_str = format_datetime_for_user(visit_iso)
                reply_text = f"¡Listo! He registrado tu solicitud de visita para {fecha_str}. Te confirmaremos los detalles a la brevedad. ¡Gracias!"
                
                # Guardar respuesta del agente
                put_message(lead_id, reply_text, direction="out")
                return reply_text
            else:
                # No se entendió la fecha
                reply_text = ("Disculpá, no pude entender la fecha u hora que mencionaste. "
                              "Por favor indicame un día y horario para la visita (por ej.: viernes 15hs o mañana 10:00).")
                put_message(lead_id, reply_text, direction="out")
                return reply_text
        
        # Obtener historial completo de conversación desde la base de datos
        conversation_history = get_conversation_history(lead_id, limit=20)
        
        if verbose:
            print(f"💬 Historial: {len(conversation_history)} mensajes")
        
        # *** Verificar si todos los datos están completos para agendamiento automático ***
        if lead.get("PendingPropertyId") and lead.get("Stage") != "AWAITING_DATE":
            # Verificar datos de precalificación en el historial
            buyer_confirmed = any(
                msg.get("role") == "user" and any(word in msg.get("content", "").lower() for word in ["para mi", "para mí", "es mío", "para mia", "mio", "mía"])
                for msg in conversation_history[-10:]
            )
            motive_confirmed = any(
                msg.get("role") == "user" and any(word in msg.get("content", "").lower() for word in ["mudanza", "mudarme", "inversión", "invertir", "inversion", "inversor"])
                for msg in conversation_history[-10:]
            )
            financing_confirmed = any(
                msg.get("role") == "user" and any(word in msg.get("content", "").lower() for word in ["ahorro", "crédito", "efectivo", "financio", "banco", "tengo", "suficiente"])
                for msg in conversation_history[-10:]
            ) or lead.get("Budget")
            ready_to_close = any(
                msg.get("role") == "user" and any(word in msg.get("content", "").lower() for word in ["puedo avanzar", "si me gusta", "estoy listo", "podemos coordinar", "quiero comprar", "quiero alquilar", "me interesa"])
                for msg in conversation_history[-5:]
            )
            
            if verbose:
                print(f"[DEBUG] Verificando datos completos:")
                print(f"   buyer_confirmed: {buyer_confirmed}")
                print(f"   motive_confirmed: {motive_confirmed}")
                print(f"   financing_confirmed: {financing_confirmed}")
                print(f"   ready_to_close: {ready_to_close}")
            
            if buyer_confirmed and motive_confirmed and financing_confirmed and ready_to_close:
                if verbose:
                    print(f"🚀 TODOS LOS DATOS COMPLETOS - FORZANDO AGENDAMIENTO")
                set_stage_awaiting_date(lead, lead["PendingPropertyId"])
                update_lead(lead_id, {"Stage": "AWAITING_DATE"})
                reply_text = "Perfecto! Que día y horario te conviene para la visita?"
                put_message(lead_id, reply_text, direction="out")
                return reply_text
        
        # Intentar identificar la propiedad específica por la que consulta
        property_context = get_property_by_context(lead, message_text)
        
        if verbose and property_context:
            print(f"🏠 Propiedad detectada: {property_context.get('Title', 'Sin título')}")
        
        # Generar respuesta como agente inmobiliario usando IA conversacional
        reply_text = generate_agent_response(
            conversation_history=conversation_history,
            lead_data=lead,
            property_context=property_context
        )
        
        # Si no hay respuesta (API falló), no responder nada
        if reply_text is None:
            if verbose:
                print("❌ No se pudo generar respuesta (API no disponible)")
            return ""
        
        # *** DETECCIÓN AUTOMÁTICA: Si el LLM pregunta por fecha/hora, setear Stage AWAITING_DATE ***
        visit_scheduling_keywords = ["que día", "qué día", "horario", "fecha", "cuando", "cuándo", "visita", "coordinar", "agendar"]
        
        if verbose:
            print(f"🔍 Verificando detección de agendamiento...")
            print(f"   Respuesta: {reply_text[:100] if reply_text else 'None'}...")
        
        # Detectar confirmación de propiedad
        property_confirmation_keywords = ["es esta la propiedad", "te interesa", "es esta", "es la que buscas"]
        
        if reply_text and any(keyword in reply_text.lower() for keyword in property_confirmation_keywords):
            if verbose:
                print(f"✅ DETECTADO pregunta de confirmación de propiedad!")
            
            available_props = get_filtered_properties(lead)
            if len(available_props) == 1 and lead.get("Stage") != "AWAITING_PROPERTY_CONFIRMATION":
                property_id = available_props[0].get("PropertyId")
                if verbose:
                    print(f"🔄 SETEANDO Stage=AWAITING_PROPERTY_CONFIRMATION, PropertyId={property_id}")
                update_lead(lead_id, {"Stage": "AWAITING_PROPERTY_CONFIRMATION", "PendingPropertyId": property_id})
                if verbose:
                    print(f"✅ Lead actualizado para esperar confirmación de propiedad")
        
        # Detectar agendamiento específico
        elif reply_text and any(phrase in reply_text.lower() for phrase in ["que día", "qué día", "que dia", "horario te conviene", "cuando te conviene"]):
            # DETECCIÓN ESPECÍFICA: Frases que indican pregunta por fecha de agendamiento
            if verbose:
                print(f"✅ DETECTADO pregunta de fecha/horario!")
            
            available_props = get_filtered_properties(lead)
            if verbose:
                print(f"   Propiedades disponibles: {len(available_props)}")
            
            if len(available_props) == 1 or lead.get("PendingPropertyId"):
                property_id = lead.get("PendingPropertyId") or available_props[0].get("PropertyId")
                if verbose:
                    print(f"   PropertyId encontrado: {property_id}")
                    print(f"   Stage actual: {lead.get('Stage')}")
                
                if property_id and lead.get("Stage") != "AWAITING_DATE":
                    if verbose:
                        print(f"🔄 SETEANDO Stage=AWAITING_DATE, PropertyId={property_id}")
                    set_stage_awaiting_date(lead, property_id)
                    update_lead(lead_id, {"Stage": "AWAITING_DATE", "PendingPropertyId": property_id})
                    if verbose:
                        print(f"✅ Lead actualizado para esperar fecha de visita")
                else:
                    if verbose:
                        print(f"⚠️ No se setea Stage: property_id={property_id}, current_stage={lead.get('Stage')}")
            else:
                if verbose:
                    print(f"⚠️ No se puede setear AWAITING_DATE: {len(available_props)} propiedades disponibles")
        else:
            if verbose:
                print(f"❌ NO se detectaron palabras especiales")
        
        # Actualizar datos del lead si tenemos nueva información
        if any(slots.values()):
            update_data = {}
            if slots.get("intent"):
                update_data["Intent"] = slots["intent"]
            if slots.get("rooms"):
                update_data["Rooms"] = slots["rooms"]
            if slots.get("budget"):
                update_data["Budget"] = slots["budget"]
            if slots.get("neighborhood"):
                update_data["Neighborhood"] = slots["neighborhood"]
            
            # Determinar estado del lead
            status = "QUALIFIED" if qualifies(lead) else "NEW"
            update_data["Status"] = status
            
            if update_data:
                update_lead(lead_id, update_data)
                if verbose:
                    print(f"📝 Lead actualizado: {update_data}")

        # Guardar respuesta del agente en la base de datos real
        put_message(lead_id, reply_text, direction="out")
        
        if verbose:
            print("✅ Respuesta guardada en DB")
        
        return reply_text
        
    except Exception as e:
        error_msg = f"Disculpa, tuve un problema técnico: {str(e)}"
        print(f"❌ Error: {e}")
        return error_msg

def get_conversation_summary(phone_number: str, limit: int = 10):
    """
    Obtiene un resumen de la conversación de un número específico desde la base de datos.
    
    Args:
        phone_number: Número de teléfono
        limit: Número máximo de mensajes a mostrar
        
    Returns:
        Lista de mensajes formateados
    """
    try:
        history = get_conversation_history(phone_number, limit=limit)
        
        print(f"\n📋 HISTORIAL DE CONVERSACIÓN - {phone_number}")
        print("="*60)
        
        if not history:
            print("No hay mensajes en el historial.")
            print("="*60)
            return []
        
        for i, msg in enumerate(history, 1):
            role_icon = "👤" if msg["role"] == "user" else "🤖"
            role_name = "Usuario" if msg["role"] == "user" else "Gonzalo"
            print(f"{i}. {role_icon} {role_name}: {msg['content']}")
        
        print("="*60)
        return history
        
    except Exception as e:
        print(f"❌ Error al obtener historial: {e}")
        return []

def get_lead_summary(phone_number: str):
    """
    Obtiene un resumen de la información del lead desde la base de datos.
    
    Args:
        phone_number: Número de teléfono
        
    Returns:
        Diccionario con información del lead
    """
    try:
        lead = get_lead(phone_number)
        
        print(f"\n📊 INFORMACIÓN DEL LEAD - {phone_number}")
        print("="*60)
        
        for key, value in lead.items():
            if key not in ["CreatedAt", "UpdatedAt"]:
                print(f"{key}: {value}")
        
        print("="*60)
        return lead
        
    except Exception as e:
        print(f"❌ Error al obtener información del lead: {e}")
        return {}


