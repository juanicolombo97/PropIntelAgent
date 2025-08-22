import json
from typing import Dict, Any
from config import OPENAI_API_KEY, OPENAI_MODEL

client = None
if OPENAI_API_KEY:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception:
        client = None

SYSTEM_PROMPT = (
    "Sos un asistente de precalificación inmobiliaria. "
    "Extraé JSON con las claves: "
    "intent (alquiler|venta|consulta), rooms (int), budget (int), "
    "neighborhood (str), visit_intent (bool), missing (array). "
    "No inventes; si falta, poné null y agregalo a missing. Devolvé SOLO JSON."
)

def extract_slots(text: str) -> Dict[str, Any]:
    # Sin API key → slots vacíos; el flujo sigue con preguntas
    if not client:
        return {"intent": None, "rooms": None, "budget": None,
                "neighborhood": None, "visit_intent": False, "missing": []}
    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Texto: {text}\nJSON:"}
        ]
        resp = client.chat.completions.create(
            model=OPENAI_MODEL,
            temperature=0.2,
            messages=messages,
            response_format={"type": "json_object"},
        )
        parsed = json.loads(resp.choices[0].message.content)
        return {
            "intent": parsed.get("intent"),
            "rooms": parsed.get("rooms"),
            "budget": parsed.get("budget"),
            "neighborhood": parsed.get("neighborhood"),
            "visit_intent": bool(parsed.get("visit_intent", False)),
            "missing": parsed.get("missing", []),
        }
    except Exception as e:
        print(f"[AI][ERROR] {e}")
        return {"intent": None, "rooms": None, "budget": None,
                "neighborhood": None, "visit_intent": False, "missing": []}



def parse_visit_datetime(text: str) -> dict:
    """
    Devuelve {"iso": "<ISO8601>"} o {"iso": null}
    Confía en OpenAI si hay API key; si no, vuelve null.
    """
    if not client:
        return {"iso": None}
    try:
        messages = [
            {"role": "system", "content":
             "Sos un parser de fecha/hora en español de AR. "
             "Devolvé JSON con clave 'iso' en formato ISO8601 con zona UTC si se puede inferir; "
             "si no, devolvé iso:null. Aceptá frases como 'viernes a las 15', 'mañana 18hs', "
             "'29/08 15:00', 'lunes 10am'."},
            {"role": "user", "content": text}
        ]
        resp = client.chat.completions.create(
            model=OPENAI_MODEL,
            temperature=0,
            messages=messages,
            response_format={"type": "json_object"},
        )
        import json
        data = json.loads(resp.choices[0].message.content)
        iso = data.get("iso")
        # Sanitizar: string no vacía
        return {"iso": iso if isinstance(iso, str) and iso.strip() else None}
    except Exception as e:
        print(f"[AI][DATE][ERROR] {e}")
        return {"iso": None}
