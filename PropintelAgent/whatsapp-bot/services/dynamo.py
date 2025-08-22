from datetime import datetime, timezone
import time
from typing import Dict, Any, List

import boto3
from boto3.dynamodb.conditions import Key
from config import LEADS_TABLE, MESSAGES_TABLE, PROPERTIES_TABLE, VISITS_TABLE

dynamodb = boto3.resource("dynamodb")
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

def create_visit(lead_id: str, property_id: str, visit_iso: str):
    t_visits.put_item(Item={
        "LeadId": lead_id,
        "VisitAt": visit_iso,
        "PropertyId": property_id,
        "Confirmed": False,
        "CreatedAt": now_iso(),
    })
