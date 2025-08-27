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
        "Status": "NEW",
        "Intent": None,
        "Rooms": None,
        "Budget": None,
        "Neighborhood": None,
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

def create_visit(lead_id: str, property_id: str, visit_iso: str):
    t_visits.put_item(Item={
        "LeadId": lead_id,
        "VisitAt": visit_iso,
        "PropertyId": property_id,
        "Confirmed": False,
        "CreatedAt": now_iso(),
    })
