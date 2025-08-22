from datetime import datetime, timezone

def now_iso() -> str:
    """Retorna la fecha y hora actual en formato ISO 8601 con timezone UTC"""
    return datetime.now(timezone.utc).isoformat()

def parse_iso_date(iso_string: str) -> datetime:
    """Parsea una fecha ISO 8601 a datetime"""
    return datetime.fromisoformat(iso_string.replace('Z', '+00:00'))

def format_date_for_display(date_string: str) -> str:
    """Formatea una fecha ISO para mostrar al usuario"""
    try:
        dt = parse_iso_date(date_string)
        return dt.strftime("%d/%m/%Y %H:%M")
    except:
        return date_string 