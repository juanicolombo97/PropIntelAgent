from fastapi import APIRouter, Form
from fastapi.responses import PlainTextResponse, JSONResponse

from services.dynamo import (
    put_message, get_lead, update_lead, t_props, query_messages
)
from services.ai import extract_slots
from services.matching import find_matches, format_props_sms
from models.schemas import merge_profile, qualifies, next_question, dec_to_native

router = APIRouter()

def build_reply(lead: dict, last_text: str) -> str:
    missing = lead.get("Missing", [])
    if missing:
        return next_question(lead)
    if qualifies(lead):
        props = find_matches(lead, t_props, limit=3)
        if props:
            listado = format_props_sms(props)
            return ("Perfecto, cumplís con lo necesario. Te dejo opciones que encajan:\n"
                    f"{listado}\n\n¿Querés coordinar visita de alguna?")
        return ("Perfecto, cumplís con lo necesario. "
                "No tengo opciones exactas ahora; ¿querés que te avise cuando entre algo similar?")
    return ("Gracias por la info. Por ahora no tengo algo que encaje perfecto. "
            "¿Querés que te avise si entra algo similar?")

@router.post("/webhook")
async def webhook(From: str = Form(...), Body: str = Form(...)):
    lead_id = From

    # 1) log del mensaje entrante
    put_message(lead_id, Body, direction="in")

    # 2) traer/crear lead y enriquecer con IA
    lead = get_lead(lead_id)
    slots = extract_slots(Body)  # tolera que no haya API key; devuelve vacíos
    lead = merge_profile(lead, slots)

    # 3) status + respuesta
    status = "QUALIFIED" if qualifies(lead) else "NEW"
    update_lead(lead_id, {
        "Status": status,
        "Intent": lead.get("Intent"),
        "Rooms": lead.get("Rooms"),
        "Budget": lead.get("Budget"),
        "Neighborhood": lead.get("Neighborhood"),
    })

    reply_text = build_reply(lead, Body)

    # 4) mensaje saliente
    put_message(lead_id, reply_text, direction="out")

    # 5) TwiML
    xml = f"<Response><Message>{reply_text}</Message></Response>"
    return PlainTextResponse(xml, media_type="application/xml")

# ---- Endpoints de lectura para el panel ----

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
    # simple scan (activo + filtro por barrio si viene)
    from boto3.dynamodb.conditions import Attr
    scan_kwargs = {"FilterExpression": Attr("Status").eq("ACTIVE")}
    if neighborhood:
        scan_kwargs["FilterExpression"] = (
            Attr("Status").eq("ACTIVE") & Attr("Neighborhood").eq(neighborhood)
        )
    resp = t_props.scan(**scan_kwargs)
    items = resp.get("Items", [])
    return {"items": dec_to_native(items[:limit])}
