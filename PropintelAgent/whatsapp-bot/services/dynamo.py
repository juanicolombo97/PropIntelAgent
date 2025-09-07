from datetime import datetime, timezone
import time
from typing import Dict, Any, List

import boto3
import os
from boto3.dynamodb.conditions import Key
from config import LEADS_TABLE, MESSAGES_TABLE, PROPERTIES_TABLE, VISITS_TABLE

# Usar la región configurada en las variables de entorno
AWS_REGION = os.getenv("AWS_REGION", "us-east-2")
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
t_leads = dynamodb.Table(LEADS_TABLE)
t_msgs = dynamodb.Table(MESSAGES_TABLE)
t_props = dynamodb.Table(PROPERTIES_TABLE)
t_visits = dynamodb.Table(VISITS_TABLE)

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def put_message(lead_id: str, text: str, direction: str = "in") -> str:
    ts = str(int(time.time()))
    t_msgs.put_item(Item={
        "LeadId": lead_id,
        "Timestamp": ts,
        "Direction": direction,
        "Text": text
    })
    return ts

def get_lead(lead_id: str) -> Dict[str, Any]:
    resp = t_leads.get_item(Key={"LeadId": lead_id})
    if "Item" in resp:
        return resp["Item"]
    item = {
        "LeadId": lead_id,
        "Status": "NUEVO",  # Usar nuevos estados
        "Stage": "PRECALIFICACION",  # Nueva etapa por defecto
        "Intent": None,
        "Rooms": None,
        "Budget": None,
        "Neighborhood": None,
        "PropertyId": None,  # Propiedad identificada
        "QualificationData": {
            "property_confirmed": False,
            "buyer_confirmed": False,
            "motive_confirmed": False,
            "timeline_confirmed": False,
            "financing_confirmed": False,
            "ready_to_close": False,
            "needs_to_sell": None,
            "has_preapproval": None,
            "decision_maker": False
        },
        "CreatedAt": now_iso(),
        "UpdatedAt": now_iso(),
    }
    t_leads.put_item(Item=item)
    return item

def update_lead(lead_id: str, fields: Dict[str, Any]):
    expr_names = {}
    expr_values = {":u": now_iso()}
    sets = ["UpdatedAt = :u"]
    i = 0
    for k, v in fields.items():
        i += 1
        nk = f"#F{i}"
        nv = f":v{i}"
        expr_names[nk] = k
        expr_values[nv] = v
        sets.append(f"{nk} = {nv}")
    t_leads.update_item(
        Key={"LeadId": lead_id},
        UpdateExpression="SET " + ", ".join(sets),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
    )

def query_messages(lead_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    resp = t_msgs.query(
        KeyConditionExpression=Key("LeadId").eq(lead_id),
        ScanIndexForward=False,
        Limit=limit,
    )
    return resp.get("Items", [])

def get_conversation_history(lead_id: str, limit: int = 20) -> List[Dict[str, str]]:
    """
    Obtiene el historial de conversación formateado para OpenAI.
    
    Returns:
        Lista de mensajes en formato [{"role": "user"/"assistant", "content": "..."}]
    """
    messages = query_messages(lead_id, limit)
    
    # Ordenar por timestamp (más antiguos primero)
    messages.sort(key=lambda x: x.get("Timestamp", "0"))
    
    conversation = []
    for msg in messages:
        direction = msg.get("Direction", "in")
        content = msg.get("Text", "")
        
        if content.strip():  # Solo agregar mensajes no vacíos
            role = "user" if direction == "in" else "assistant"
            conversation.append({"role": role, "content": content})
    
    return conversation

def get_property_by_context(lead_data: dict, message_text: str) -> Dict[str, Any]:
    """
    Intenta identificar la propiedad específica por la que consulta el lead.
    Busca por palabras clave en el mensaje o datos del lead.
    """
    # Palabras clave que podrían indicar una propiedad específica
    search_terms = []
    
    # Extraer del texto del mensaje
    if message_text:
        words = message_text.lower().split()
        # Buscar direcciones, barrios, o referencias específicas
        for word in words:
            if len(word) > 3:  # Evitar palabras muy cortas
                search_terms.append(word)
    
    # Usar neighborhood del lead si existe
    neighborhood = lead_data.get("Neighborhood")
    if neighborhood:
        search_terms.append(neighborhood.lower())
    
    if not search_terms:
        return {}
    
    try:
        # Buscar propiedades que coincidan con los términos
        from boto3.dynamodb.conditions import Attr
        
        filter_expression = None
        for term in search_terms[:3]:  # Máximo 3 términos para no complicar la query
            condition = (
                Attr("Title").contains(term) | 
                Attr("Neighborhood").contains(term)
            )
            if filter_expression is None:
                filter_expression = condition
            else:
                filter_expression = filter_expression | condition
        
        resp = t_props.scan(
            FilterExpression=filter_expression & Attr("Status").eq("ACTIVE"),
            Limit=1  # Solo la primera coincidencia
        )
        
        items = resp.get("Items", [])
        return items[0] if items else {}
        
    except Exception as e:
        print(f"[GET_PROPERTY][ERROR] {e}")
        return {}

def create_visit(lead_id: str, property_id: str, visit_iso: str, notes: str = None):
    print(f"🔄 Intentando crear visita...")
    print(f"   LeadId: {lead_id}")
    print(f"   PropertyId: {property_id}")
    print(f"   VisitAt: {visit_iso}")
    print(f"   Notes: {notes}")
    
    try:
        item = {
            "LeadId": lead_id,
            "VisitAt": visit_iso,
            "PropertyId": property_id,
            "Confirmed": False,
            "CreatedAt": now_iso(),
        }
        if notes:
            item["Notes"] = notes
        
        print(f"📝 Item a guardar: {item}")
        
        # Guardar en DynamoDB
        response = t_visits.put_item(Item=item)
        print(f"✅ Respuesta DynamoDB: {response}")
        print(f"✅ Visita creada exitosamente: LeadId={lead_id}, PropertyId={property_id}, VisitAt={visit_iso}, Confirmed=False")
        return True
        
    except Exception as e:
        print(f"❌ ERROR creando visita: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"❌ STACK TRACE: {traceback.format_exc()}")
        return False

def update_lead_stage_and_status(lead_id: str, stage: str, status: str, additional_fields: Dict[str, Any] = None):
    """
    Actualiza la etapa y estado del lead, junto con campos adicionales si se proporcionan
    """
    fields = {
        "Stage": stage,
        "Status": status
    }
    if additional_fields:
        fields.update(additional_fields)
    
    update_lead(lead_id, fields)
    print(f"📝 Lead {lead_id} actualizado: Stage={stage}, Status={status}")

def update_qualification_data(lead_id: str, qualification_updates: Dict[str, Any]):
    """
    Actualiza los datos de calificación del lead
    """
    # Obtener datos actuales
    lead = get_lead(lead_id)
    current_qual_data = lead.get("QualificationData", {})
    
    # Mergear con nuevos datos
    current_qual_data.update(qualification_updates)
    
    # Actualizar en la base de datos
    update_lead(lead_id, {"QualificationData": current_qual_data})
    print(f"📝 Datos de calificación actualizados para {lead_id}: {qualification_updates}")

def get_stage_appropriate_context(lead_id: str, stage: str) -> List[Dict[str, str]]:
    """
    Obtiene el contexto apropiado según la etapa del lead
    """
    from models.lead_stages import LeadStage, get_stage_context_limit
    
    try:
        stage_enum = LeadStage(stage)
        limit = get_stage_context_limit(stage_enum)
    except ValueError:
        limit = 6  # Default
    
    return get_conversation_history(lead_id, limit=limit)
