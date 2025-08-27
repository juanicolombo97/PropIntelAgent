from fastapi import APIRouter, Form
from fastapi.responses import PlainTextResponse, JSONResponse

from services.dynamo import (
    put_message, get_lead, update_lead, t_props, query_messages, create_visit,
    get_conversation_history, get_property_by_context
)
from services.ai import extract_slots, parse_visit_datetime, format_datetime_for_user, generate_agent_response
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
    Endpoint principal del webhook - Sistema de agente inmobiliario inteligente.
    Usa toda la conversación para generar respuestas contextuales como un agente real.
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
        
        # Guardar mensaje entrante
        put_message(lead_id, message_text, direction="in")

        # Obtener o crear lead
        lead = get_lead(lead_id)
        
        # Extraer información básica del mensaje (para mantener datos estructurados)
        slots = extract_slots(message_text)
        lead = merge_profile(lead, slots)
        
        # Obtener historial completo de conversación
        conversation_history = get_conversation_history(lead_id, limit=20)
        
        # Intentar identificar la propiedad específica por la que consulta
        property_context = get_property_by_context(lead, message_text)
        
        # Generar respuesta como agente inmobiliario usando IA conversacional
        reply_text = generate_agent_response(
            conversation_history=conversation_history,
            lead_data=lead,
            property_context=property_context
        )
        
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

        # Guardar respuesta del agente
        put_message(lead_id, reply_text, direction="out")
        
        # Retornar respuesta en formato TwiML
        xml = f"<Response><Message>{reply_text}</Message></Response>"
        return PlainTextResponse(xml, media_type="application/xml")
        
    except Exception as e:
        print(f"[WEBHOOK][ERROR] {e}")
        error_response = ("Disculpa, tuve un problema técnico. "
                         "Podes intentar de nuevo en un momento? "
                         "Si el problema persiste, contacta a nuestro equipo.")
        xml = f"<Response><Message>{error_response}</Message></Response>"
        return PlainTextResponse(xml, media_type="application/xml")

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
        
        # Obtener historial completo de conversación desde la base de datos
        conversation_history = get_conversation_history(lead_id, limit=20)
        
        if verbose:
            print(f"💬 Historial: {len(conversation_history)} mensajes")
        
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
