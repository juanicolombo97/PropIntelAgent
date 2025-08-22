from typing import Dict, Any
from decimal import Decimal

def dec_to_native(v):
    if isinstance(v, list):
        return [dec_to_native(x) for x in v]
    if isinstance(v, dict):
        return {k: dec_to_native(val) for k, val in v.items()}
    if isinstance(v, Decimal):
        return int(v) if v % 1 == 0 else float(v)
    return v

def merge_profile(lead: Dict[str, Any], slots: Dict[str, Any]) -> Dict[str, Any]:
    if slots.get("intent"):
        lead["Intent"] = slots["intent"]
    if slots.get("rooms") is not None:
        lead["Rooms"] = slots["rooms"]
    if slots.get("budget") is not None:
        lead["Budget"] = slots["budget"]
    if slots.get("neighborhood"):
        lead["Neighborhood"] = slots["neighborhood"]
    needed = ["Intent", "Rooms", "Budget", "Neighborhood"]
    lead["Missing"] = [k for k in needed if not lead.get(k)]
    return lead

def qualifies(lead: Dict[str, Any]) -> bool:
    if lead.get("Missing"):
        return False
    intent_ok = lead.get("Intent") in ("alquiler", "venta")
    rooms = lead.get("Rooms")
    budget = lead.get("Budget")
    neigh_ok = bool(lead.get("Neighborhood"))
    rooms_ok = isinstance(rooms, int) and rooms >= 1
    budget_ok = isinstance(budget, (int, float)) and budget >= 300
    return bool(intent_ok and rooms_ok and budget_ok and neigh_ok)

def next_question(lead: Dict[str, Any]) -> str:
    missing = lead.get("Missing", [])
    if "Intent" in missing:
        return "¿Buscás alquiler o venta?"
    if "Neighborhood" in missing:
        return "¿En qué barrio te gustaría?"
    if "Rooms" in missing:
        return "¿Cuántos ambientes necesitás?"
    if "Budget" in missing:
        return "¿Cuál es tu presupuesto aproximado?"
    return "¿Podés contarme un poco más?"



def set_last_suggestions(lead: dict, prop_ids: list[str]) -> dict:
    lead["LastSuggestions"] = prop_ids
    return lead

def choose_property_from_reply(lead: dict, body: str) -> str | None:
    body = (body or "").strip().lower()
    # por índice 1..3
    if body in ("1","2","3"):
        idx = int(body) - 1
        props = lead.get("LastSuggestions") or []
        if 0 <= idx < len(props):
            return props[idx]
    # por id explícito (prop_001)
    if body.startswith("prop_"):
        return body
    return None

def set_stage_awaiting_date(lead: dict, prop_id: str) -> dict:
    lead["Stage"] = "AWAITING_DATE"
    lead["PendingPropertyId"] = prop_id
    return lead

def clear_stage(lead: dict) -> dict:
    lead.pop("Stage", None)
    lead.pop("PendingPropertyId", None)
    return lead
