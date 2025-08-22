from typing import Dict, Any, List
from models.schemas import dec_to_native

def _prop_ok(p: Dict[str, Any], lead: Dict[str, Any]) -> bool:
    p = dec_to_native(p)
    neighborhood = lead.get("Neighborhood")
    rooms = lead.get("Rooms")
    budget = lead.get("Budget")

    if neighborhood and p.get("Neighborhood") != neighborhood:
        return False
    if isinstance(rooms, int) and isinstance(p.get("Rooms"), (int, float)) and p["Rooms"] < rooms:
        return False
    if isinstance(budget, (int, float)) and isinstance(p.get("Price"), (int, float)) and p["Price"] > budget:
        return False
    return True

def find_matches(lead: Dict[str, Any], t_props, limit: int = 3) -> List[Dict[str, Any]]:
    # Scan simple (barato al inicio). Luego: GSI_Neighborhood si hace falta.
    scan_kwargs = {
        "FilterExpression": "#S = :active",
        "ExpressionAttributeNames": {"#S": "Status"},
        "ExpressionAttributeValues": {":active": "ACTIVE"},
    }
    resp = t_props.scan(**scan_kwargs)
    items = resp.get("Items", [])
    matched = [dec_to_native(p) for p in items if _prop_ok(p, lead)]

    budget = lead.get("Budget")
    if isinstance(budget, (int, float)):
        matched.sort(key=lambda x: abs(x.get("Price", 10**9) - budget))
    else:
        matched.sort(key=lambda x: (-x.get("Rooms", 0), x.get("Price", 10**9)))

    return matched[:limit]

def format_props_sms(props: List[Dict[str, Any]]) -> str:
    lines = []
    for p in props:
        t = p.get("Title", "")
        n = p.get("Neighborhood", "")
        r = p.get("Rooms", "?")
        pr = p.get("Price", "?")
        url = p.get("URL", "")
        lines.append(f"• {t} – {n} – {r} amb – ${pr} {('→ '+url) if url else ''}")
    return "\n".join(lines)
