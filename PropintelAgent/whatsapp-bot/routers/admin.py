# routers/admin.py
from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse
from fastapi import Depends, Header, HTTPException

from boto3.dynamodb.conditions import Key, Attr
from services.dynamo import t_leads, t_msgs, t_props, t_visits
from models.schemas import dec_to_native

router = APIRouter(prefix="/admin")



@router.get("/leads")
def list_leads(status: str | None = None, limit: int = 50):
    if status:
        # requiere GSI_Status (Status + UpdatedAt)
        resp = t_leads.query(
            IndexName="GSI_Status",
            KeyConditionExpression=Key("Status").eq(status),
            ScanIndexForward=False,
            Limit=limit
        )
        items = resp.get("Items", [])
    else:
        # sin filtro → NO hay scan aquí para no romper costos; pedí siempre por status
        items = []
    return {"items": dec_to_native(items)}

@router.get("/lead")
def get_lead(lead_id: str):
    resp = t_leads.get_item(Key={"LeadId": lead_id})
    return JSONResponse(dec_to_native(resp.get("Item", {})))

@router.get("/messages")
def get_messages(lead_id: str, limit: int = 50):
    resp = t_msgs.query(
        KeyConditionExpression=Key("LeadId").eq(lead_id),
        ScanIndexForward=False,
        Limit=limit
    )
    return {"items": dec_to_native(resp.get("Items", []))}

@router.get("/properties")
def get_properties(neighborhood: str | None = None, limit: int = 100):
    if neighborhood:
        resp = t_props.scan(
            FilterExpression=Attr("Status").eq("ACTIVE") & Attr("Neighborhood").eq(neighborhood)
        )
    else:
        resp = t_props.scan(
            FilterExpression=Attr("Status").eq("ACTIVE")
        )
    items = resp.get("Items", [])
    return {"items": dec_to_native(items[:limit])}

@router.post("/properties")
def create_property(item: dict = Body(...)):
    # Espera: {PropertyId, Title, Neighborhood, Rooms, Price, Status, URL}
    t_props.put_item(Item=item)
    return {"ok": True, "id": item.get("PropertyId")}

@router.put("/properties/{property_id}")
def update_property(property_id: str, fields: dict = Body(...)):
    # build update expression dinámico
    expr_names, expr_values, sets = {}, {}, []
    i = 0
    for k, v in fields.items():
        i += 1
        nk, nv = f"#F{i}", f":v{i}"
        expr_names[nk] = k
        expr_values[nv] = v
        sets.append(f"{nk} = {nv}")
    t_props.update_item(
        Key={"PropertyId": property_id},
        UpdateExpression="SET " + ", ".join(sets),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
    )
    return {"ok": True}

@router.get("/visits")
def list_visits(lead_id: str | None = None, property_id: str | None = None, limit: int = 50):
    if lead_id:
        resp = t_visits.query(
            KeyConditionExpression=Key("LeadId").eq(lead_id),
            ScanIndexForward=False,
            Limit=limit
        )
        return {"items": dec_to_native(resp.get("Items", []))}
    if property_id:
        resp = t_visits.query(
            IndexName="GSI_Property",
            KeyConditionExpression=Key("PropertyId").eq(property_id),
            ScanIndexForward=False,
            Limit=limit
        )
        return {"items": dec_to_native(resp.get("Items", []))}
    return {"items": []}

@router.put("/visits/confirm")
def confirm_visit(lead_id: str, visit_at: str, confirmed: bool = True):
    t_visits.update_item(
        Key={"LeadId": lead_id, "VisitAt": visit_at},
        UpdateExpression="SET Confirmed = :c",
        ExpressionAttributeValues={":c": confirmed}
    )
    return {"ok": True}
