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
    """
    Determina si un lead califica para ver propiedades.
    Criterios más flexibles para mejorar la experiencia del usuario.
    """
    # Si faltan datos críticos, no califica aún
    missing = lead.get("Missing", [])
    critical_missing = ["Intent", "Neighborhood"]  # Rooms y Budget son menos críticos
    
    for field in critical_missing:
        if field in missing:
            return False
    
    # Verificar intent válido
    intent = lead.get("Intent")
    intent_ok = intent in ("alquiler", "venta")
    if not intent_ok:
        return False
    
    # Verificar que tenga al menos neighborhood
    neigh_ok = bool(lead.get("Neighborhood"))
    if not neigh_ok:
        return False
    
    # Rooms y Budget son opcionales pero si están, deben ser válidos
    rooms = lead.get("Rooms")
    budget = lead.get("Budget")
    
    rooms_ok = True  # Por defecto OK
    if rooms is not None:
        rooms_ok = isinstance(rooms, int) and rooms >= 1
    
    budget_ok = True  # Por defecto OK
    if budget is not None:
        # Criterio más flexible: mínimo 50k para alquiler, 100k para venta
        min_budget = 50000 if intent == "alquiler" else 100000
        budget_ok = isinstance(budget, (int, float)) and budget >= min_budget
    
    return bool(intent_ok and neigh_ok and rooms_ok and budget_ok)

def next_question(lead: Dict[str, Any]) -> str:
    """
    Genera la siguiente pregunta de forma más natural y conversacional.
    """
    missing = lead.get("Missing", [])
    name = lead.get("Name", "")
    
    # Saludo inicial si es la primera interacción
    if not lead.get("Intent") and not lead.get("Neighborhood") and not lead.get("Rooms") and not lead.get("Budget"):
        return "¡Hola! 👋 Soy el asistente de PropIntel. Te ayudo a encontrar la propiedad perfecta. ¿Estás buscando para alquilar o comprar?"
    
    if "Intent" in missing:
        return "Para ayudarte mejor, ¿estás buscando alquilar o comprar? 🏠"
    
    if "Neighborhood" in missing:
        return "Perfecto. ¿En qué zona o barrio te gustaría vivir? 📍"
    
    if "Rooms" in missing:
        return "¿Cuántos ambientes necesitás? Por ejemplo: monoambiente, 2 ambientes, etc. 🛏️"
    
    if "Budget" in missing:
        intent = lead.get("Intent", "")
        if intent == "alquiler":
            return "¿Cuál es tu presupuesto mensual aproximado? Podés decirme un rango. 💰"
        elif intent == "venta":
            return "¿Cuál es tu presupuesto total para la compra? 💰"
        else:
            return "¿Cuál es tu presupuesto aproximado? 💰"
    
    return "¡Perfecto! Déjame buscar las mejores opciones para vos. 🔍"



def set_last_suggestions(lead: dict, prop_ids: list[str]) -> dict:
    lead["LastSuggestions"] = prop_ids
    return lead

def choose_property_from_reply(lead: dict, body: str) -> str | None:
    """
    Detecta si el usuario está eligiendo una propiedad de las sugerencias.
    Acepta números (1-3), IDs de propiedades, o frases como "la primera", "el segundo", etc.
    """
    body = (body or "").strip().lower()
    
    # Números directos 1-3
    if body in ("1", "2", "3"):
        idx = int(body) - 1
        props = lead.get("LastSuggestions") or []
        if 0 <= idx < len(props):
            return props[idx]
    
    # Frases comunes para elegir opciones
    choice_phrases = {
        "la primera": 0, "el primero": 0, "primera": 0, "primero": 0,
        "la segunda": 1, "el segundo": 1, "segunda": 1, "segundo": 1,
        "la tercera": 2, "el tercero": 2, "tercera": 2, "tercero": 2,
        "la ultima": 2, "el ultimo": 2, "ultima": 2, "ultimo": 2
    }
    
    for phrase, idx in choice_phrases.items():
        if phrase in body:
            props = lead.get("LastSuggestions") or []
            if 0 <= idx < len(props):
                return props[idx]
    
    # ID explícito de propiedad (prop_001)
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
