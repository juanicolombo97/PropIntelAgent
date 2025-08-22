from fastapi import APIRouter, Form
from fastapi.responses import PlainTextResponse, JSONResponse

from services.dynamo import (
    put_message, get_lead, update_lead, t_props, query_messages, create_visit
)
from services.ai import extract_slots, parse_visit_datetime
from services.matching import find_matches, format_props_sms, props_ids
from models.schemas import (
    merge_profile, qualifies, next_question, dec_to_native,
    set_last_suggestions, choose_property_from_reply,
    set_stage_awaiting_date, clear_stage
)

router = APIRouter()

def build_reply_qualified(lead: dict, last_text: str) -> str:
    # Si está esperando fecha para una propiedad
    if lead.get("Stage") == "AWAITING_DATE":
        # Intentar parsear fecha/hora
        parsed = parse_visit_datetime(last_text)
        iso = parsed.get("iso")
        if iso and lead.get("PendingPropertyId"):
            create_visit(lead["LeadId"], lead["PendingPropertyId"], iso)
            clear_stage(lead)
            update_lead(lead["LeadId"], {
                "Stage": None,
                "PendingPropertyId": None
            })
            return f"Listo, agendé la visita para {iso}. Te confirmo por este medio."
        else:
            return "Decime día y hora (ej: 'viernes 15:00' o '29/08 18hs')."

    # Si responde con una elección (1-3 o prop_XXX)
    prop_choice = choose_property_from_reply(lead, last_text)
    if prop_choice:
        set_stage_awaiting_date(lead, prop_choice)
        update_lead(lead["LeadId"], {
            "Stage": "AWAITING_DATE",
            "PendingPropertyId": prop_choice
        })
        return "Genial. ¿Qué día y hora te queda bien para la visita?"

    # Sugerir propiedades si aún no sugirió o pide más
    props = find_matches(lead, t_props, limit=3)
    if props:
        ids = props_ids(props)
        set_last_suggestions(lead, ids)
        update_lead(lead["LeadId"], {"LastSuggestions": ids})
        listado = format_props_sms(props)
        return ("Te dejo opciones que encajan:\n"
                f"{listado}\n\nRespondé '1', '2' o '3' para elegir, o pasame el ID (p.ej. prop_001).")
    return ("Cumplís con lo necesario. No tengo opciones exactas ahora; "
            "¿querés que te avise cuando entre algo similar?")

def build_reply(lead: dict, last_text: str) -> str:
    if lead.get("Missing"):
        return next_question(lead)
    if qualifies(lead):
        return build_reply_qualified(lead, last_text)
    return ("Gracias por la info. Por ahora no tengo algo que encaje perfecto. "
            "¿Querés que te avise si entra algo similar?")

@router.post("/webhook")
async def webhook(From: str = Form(...), Body: str = Form(...)):
    lead_id = From
    put_message(lead_id, Body, direction="in")

    lead = get_lead(lead_id)
    slots = extract_slots(Body)
    lead = merge_profile(lead, slots)

    status = "QUALIFIED" if qualifies(lead) else "NEW"
    update_lead(lead_id, {
        "Status": status,
        "Intent": lead.get("Intent"),
        "Rooms": lead.get("Rooms"),
        "Budget": lead.get("Budget"),
        "Neighborhood": lead.get("Neighborhood"),
    })

    reply_text = build_reply(lead, Body)

    put_message(lead_id, reply_text, direction="out")
    xml = f"<Response><Message>{reply_text}</Message></Response>"
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
