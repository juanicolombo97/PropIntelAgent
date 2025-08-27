from typing import Dict, Any, List
from models.schemas import dec_to_native


def props_ids(props: List[Dict[str, Any]]) -> list[str]:
    return [p.get("PropertyId") for p in props if p.get("PropertyId")]


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

    result = matched[:limit]
    return result 

def format_props_sms(props: List[Dict[str, Any]]) -> str:
    """
    Formatea las propiedades de manera más atractiva y legible para WhatsApp.
    """
    lines = []
    for i, p in enumerate(props, 1):
        title = p.get("Title", "Propiedad sin título")
        neighborhood = p.get("Neighborhood", "Zona no especificada")
        rooms = p.get("Rooms", "?")
        price = p.get("Price", "Consultar precio")
        url = p.get("URL", "")
        
        # Formatear precio
        if isinstance(price, (int, float)) and price > 0:
            if price >= 1000000:
                price_str = f"${price/1000000:.1f}M"
            elif price >= 1000:
                price_str = f"${price/1000:.0f}k"
            else:
                price_str = f"${price:,.0f}"
        else:
            price_str = "💰 Consultar"
        
        # Formatear ambientes
        if isinstance(rooms, (int, float)):
            if rooms == 1:
                rooms_str = "1 ambiente"
            else:
                rooms_str = f"{int(rooms)} ambientes"
        else:
            rooms_str = "Ambientes a consultar"
        
        # Construir línea
        line = f"*{i}.* 🏠 *{title}*\n"
        line += f"   📍 {neighborhood}\n"
        line += f"   🛏️ {rooms_str} • {price_str}"
        
        if url:
            line += f"\n   🔗 Ver más: {url}"
        
        lines.append(line)
    
    return "\n\n".join(lines)
