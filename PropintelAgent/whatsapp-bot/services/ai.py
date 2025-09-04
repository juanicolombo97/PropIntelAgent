import json
from typing import Dict, Any
from datetime import datetime
from config import OPENAI_API_KEY, OPENAI_MODEL

client = None
if OPENAI_API_KEY:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception:
        client = None

AGENT_SYSTEM_PROMPT = """Sos Gonzalo, agente inmobiliario profesional de Compromiso Inmobiliario (Argentina).

ROL Y TONO
- Profesional y cercano, humano, sin sonar a asistente virtual
- Español argentino, natural y directo
- Nunca uses emojis ni signos de pregunta invertidos (escribís "como estas?")
- Frases cortas, una sola pregunta por mensaje cuando sea posible

OBJETIVO
- Llevar una conversación natural para precalificar y, solo si corresponde, proponer visita.
- Si el cliente pide, podés derivar a un humano con tacto.

POLÍTICA DE CONVERSACIÓN
- Saludo inicial breve y humano. Si el cliente menciona una propiedad, usá esa referencia.
- No ofrezcas visita si no hay propiedad concreta ni si faltan requisitos mínimos.
- No preguntes "alquilar o comprar" si ya se deduce del contexto (ej: dijo "quiero comprar").
- Hacé preguntas adaptativas: solo lo que falta. Combiná cuando tenga sentido.
- Si el cliente no coopera tras 2 intentos, cerrá cordialmente y ofrecé hablar con un asesor humano.

REQUISITOS MÍNIMOS PARA AGENDAR VISITA
1) Referencia clara de la propiedad: link, dirección, código, o barrio + detalle. Si no hay propiedad concreta → no se agenda. Solo sugerí opciones si el cliente lo pide.
2) Para quién es la compra: confirmar si es para él/ella u otra persona. La visita debe ser con quien decide.
3) Motivo de búsqueda: mudanza o inversión.
4) Plazo y antigüedad de búsqueda: en cuánto tiempo piensa concretar y hace cuánto busca.
5) Capacidad económica:
   - Necesita vender para comprar? Si sí, confirmar que su propiedad esté publicada (idealmente link).
   - Cómo financia: ahorro, crédito o mixto. Si crédito, confirmar preaprobación (banco y monto).
   - Si no tiene fondos ni crédito aprobado → no se agenda.
6) Listo para cerrar: "Si la propiedad cumple lo que buscás, estás en condiciones de avanzar o hay algo que te frene?" Debe responder que sí (o condiciones ya cumplidas).

CONDICIONES PARA NO AGENDAR
- No tiene fondos ni crédito preaprobado.
- Necesita vender pero aún no publicó su propiedad.
- El decisor real no va a la visita.
- No brinda info clave para precalificar.
→ En estos casos, cerrá cordialmente, sin ofrecer visita, y ofrecé ayuda/asesoría.

CONDICIONES PARA SÍ AGENDAR
- Tiene dinero o crédito preaprobado.
- No depende de vender (o si depende, ya tiene la propiedad publicada en venta).
- La visita la hace quien decide.
- Responde que puede avanzar si le gusta.
→ En este escenario, proponé directamente día y hora concretos (no preguntes abierto). Mantené el tono humano.

OTRAS REGLAS
- Si el cliente pide sugerencias, pedí 1-2 criterios clave y ofrecé 2-3 opciones (resumen breve). Si no lo pide, no envíes listados.
- Si el cliente pide hablar con un humano, confirmá y ofrecé derivar.
- Mostrá empatía y claridad; no repitas preguntas ya respondidas.

EJEMPLOS BREVES
Cliente: "Quiero coordinar visita"
Gonzalo: "Puedo coordinarte, pero antes necesito confirmar algunos datos que me pide el sistema. Lo vemos rápido y seguimos. Te contactaste por qué propiedad en particular?"

Cliente: "Es para mi, para mudarme"
Gonzalo: "Perfecto. En qué plazo pensás mudarte y hace cuánto estás buscando?"

Cliente: "No quiero responder"
Gonzalo: "Te entiendo, pero sin esa info no puedo agendar. Es para no hacerte perder tiempo. Si preferís, te derivo con un asesor humano. Cómo querés seguir?"

Respondé siempre como una persona de inmobiliaria con experiencia.
"""

def extract_slots(text: str) -> Dict[str, Any]:
    """
    Extrae información estructurada del mensaje usando reglas y OpenAI cuando esté disponible.
    """
    text_lower = text.lower()
    result = {
        "intent": None, 
        "rooms": None, 
        "budget": None,
        "neighborhood": None, 
        "visit_intent": False, 
        "missing": []
    }
    
    # EXTRACCIÓN CON REGLAS (siempre funciona)
    
    # 1. Intent (alquiler/venta)
    if any(word in text_lower for word in ["alquil", "rent", "arrendar"]):
        result["intent"] = "alquiler"
    elif any(word in text_lower for word in ["compr", "venta", "vend"]):
        result["intent"] = "venta"
    
    # 2. Ambientes/Rooms
    import re
    room_patterns = [
        r"(\d+)\s*amb",
        r"(\d+)\s*habitac",
        r"(\d+)\s*dormitor",
        r"(\d+)\s*cuarto",
        r"monoambiente",
        r"mono"
    ]
    
    for pattern in room_patterns:
        match = re.search(pattern, text_lower)
        if match:
            if pattern in ["monoambiente", "mono"]:
                result["rooms"] = 1
            else:
                try:
                    result["rooms"] = int(match.group(1))
                except:
                    pass
            break
    
    # 3. Budget
    budget_patterns = [
        r"(\d+)k",  # 150k
        r"(\d+\.?\d*)\s*m",  # 1.5M
        r"\$\s*(\d{1,3}(?:[.,]\d{3})*)",  # $150,000
        r"(\d{1,3}(?:[.,]\d{3})*)\s*peso",  # 150,000 pesos
        r"presupuesto.*?(\d{1,3}(?:[.,]\d{3})*)"  # presupuesto 150000
    ]
    
    for pattern in budget_patterns:
        match = re.search(pattern, text_lower)
        if match:
            try:
                amount_str = match.group(1).replace(",", "").replace(".", "")
                if "k" in pattern:
                    result["budget"] = int(float(amount_str) * 1000)
                elif "m" in pattern:
                    result["budget"] = int(float(amount_str) * 1000000)
                else:
                    result["budget"] = int(amount_str)
                break
            except:
                pass
    
    # 4. Neighborhood
    barrios = {
        "nuñez": "Núñez", "palermo": "Palermo", "belgrano": "Belgrano",
        "recoleta": "Recoleta", "san telmo": "San Telmo", "puerto madero": "Puerto Madero",
        "villa crespo": "Villa Crespo", "caballito": "Caballito", "flores": "Flores",
        "barracas": "Barracas", "boca": "La Boca", "tigre": "Tigre",
        "vicente lopez": "Vicente López", "olivos": "Olivos", "martinez": "Martínez"
    }
    
    for barrio_key, barrio_nombre in barrios.items():
        if barrio_key in text_lower:
            result["neighborhood"] = barrio_nombre
            break
    
    # 5. Visit intent
    visit_keywords = ["visita", "ver", "conocer", "mostrar", "coordinar", "agendar"]
    result["visit_intent"] = any(keyword in text_lower for keyword in visit_keywords)
    
    # Si OpenAI está disponible, usar para refinar
    if client:
        try:
            extraction_prompt = """Extraé información básica de este mensaje inmobiliario en JSON:
- intent: "alquiler", "venta", o "consulta" (null si no está claro)
- rooms: número de ambientes como entero (null si no se menciona)
- budget: presupuesto en pesos como entero (null si no se menciona)
- neighborhood: barrio mencionado (null si no se menciona)
- visit_intent: true si quiere ver/visitar propiedades

Convertí montos: 150k=150000, 1.5M=1500000. Solo JSON:"""

            messages = [
                {"role": "system", "content": extraction_prompt},
                {"role": "user", "content": f"Texto: {text}"}
            ]
            resp = client.chat.completions.create(
                model=OPENAI_MODEL,
                temperature=0.1,
                messages=messages,
                response_format={"type": "json_object"},
            )
            ai_result = json.loads(resp.choices[0].message.content)
            
            # Combinar resultados: AI override si detecta algo que reglas no detectaron
            for key in ["intent", "rooms", "budget", "neighborhood", "visit_intent"]:
                if ai_result.get(key) and not result.get(key):
                    result[key] = ai_result[key]
                    
        except Exception as e:
            print(f"[AI][ERROR] {e}")
    
    return result



def parse_visit_datetime(text: str) -> dict:
    """
    Devuelve {"iso": "<ISO8601>"} o {"iso": null}
    Confía en OpenAI si hay API key; si no, vuelve null.
    """
    if not client:
        return {"iso": None}
    try:
        system_prompt = """Sos un parser de fechas/horarios en español argentino para agendar visitas inmobiliarias.

OBJETIVO: Convertir expresiones de fecha/hora en español a formato ISO8601 con zona horaria de Argentina (UTC-3).

FORMATO DE SALIDA: {"iso": "YYYY-MM-DDTHH:MM:SS-03:00"} o {"iso": null}

ACEPTO ESTAS EXPRESIONES:
- Días de semana: "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"
- Fechas: "29/08", "15 de enero", "mañana", "pasado mañana", "hoy"
- Horarios: "15:00", "3 de la tarde", "18hs", "10am", "20:30"
- Combinadas: "viernes a las 15", "lunes 10am", "mañana a las 18"

REGLAS:
- Si solo mencionan día sin hora, usar 10:00 AM por defecto
- Si solo mencionan hora sin día, usar el próximo día hábil (lunes-viernes)
- "Mañana" = siguiente día
- "Pasado mañana" = día después de mañana
- Horarios en formato 24hs: 15:00 = 3 PM
- Si hay ambigüedad o no se puede parsear, devolver {"iso": null}

EJEMPLOS:
"viernes a las 15" → {"iso": "2024-01-12T15:00:00-03:00"} (asumiendo viernes próximo)
"mañana 18hs" → {"iso": "2024-01-09T18:00:00-03:00"} (día siguiente)
"lunes por la mañana" → {"iso": "2024-01-15T10:00:00-03:00"} (lunes próximo a las 10)
"no puedo" → {"iso": null}

Devolvé SOLO el JSON."""

        messages = [
            {"role": "system", "content": system_prompt},
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


def format_datetime_for_user(iso_string: str) -> str:
    """
    Convierte una fecha ISO8601 a un formato legible para el usuario argentino.
    Ej: "2024-01-15T15:00:00-03:00" -> "lunes 15 de enero a las 15:00"
    """
    if not iso_string:
        return "fecha no especificada"
    
    try:
        # Parsear la fecha ISO
        dt = datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
        
        # Nombres de días y meses en español
        dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
        meses = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ]
        
        # Obtener componentes
        dia_semana = dias[dt.weekday()]
        dia_mes = dt.day
        mes = meses[dt.month - 1]
        hora = dt.strftime("%H:%M")
        
        return f"{dia_semana} {dia_mes} de {mes} a las {hora}"
    
    except Exception as e:
        print(f"[FORMAT_DATE][ERROR] {e}")
        return "fecha no válida"


def generate_agent_response(conversation_history: list, lead_data: dict, property_context: dict = None) -> str:
    """
    Genera la respuesta del agente usando exclusivamente el LLM con historial.
    No aplica reglas conversacionales hardcodeadas; toda la lógica vive en el prompt.
    """
    # Llamar a OpenAI para generar la respuesta conversacional (si la API está disponible)
    if client:
        try:
            # Construir contexto de propiedad (opcional)
            property_info = ""
            if property_context:
                prop_title = property_context.get("Title", "la propiedad")
                prop_neighborhood = property_context.get("Neighborhood", "")
                property_info = f"\nPROPIEDAD: {prop_title}"
                if prop_neighborhood:
                    property_info += f" en {prop_neighborhood}"
                prop_price = property_context.get("Price")
                if prop_price is not None:
                    try:
                        price_val = float(prop_price)
                        if price_val >= 1000000:
                            price_str = f"${price_val/1000000:.1f}M"
                        elif price_val >= 1000:
                            price_str = f"${int(price_val/1000)}k"
                        else:
                            price_str = f"${int(price_val)}"
                    except Exception:
                        price_str = str(prop_price)
                    property_info += f" • Precio: {price_str}"
                prop_rooms = property_context.get("Rooms")
                if prop_rooms:
                    try:
                        rooms_num = int(prop_rooms)
                        property_info += (" • 1 ambiente" if rooms_num == 1 else f" • {rooms_num} ambientes")
                    except Exception:
                        pass
                prop_url = property_context.get("URL")
                if prop_url:
                    property_info += f" • Link: {prop_url}"

            # Preparar mensajes: prompt de sistema + historial completo (reciente)
            messages = [{"role": "system", "content": AGENT_SYSTEM_PROMPT + property_info}]
            # Limitar a últimos 20 mensajes para contexto suficiente
            for msg in conversation_history[-20:]:
                messages.append(msg)

            response = client.chat.completions.create(
                model=OPENAI_MODEL,
                temperature=0.4,
                messages=messages,
                max_tokens=220
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[AGENT_RESPONSE][ERROR] {e}")

    # Fallback simple si no hay cliente o hubo error: respuesta humana mínima
    last_user = ""
    for msg in reversed(conversation_history):
        if msg.get("role") == "user":
            last_user = msg.get("content", "").strip()
            break
    if not conversation_history:
        return "Hola! Soy Gonzalo de Compromiso Inmobiliario. Como puedo ayudarte?"
    if last_user:
        return "Gracias por tu mensaje. Contame un poco mas asi te ayudo mejor."
    return "Te leo. Como queres que te ayude?"


def detect_visit_request(conversation_history: list, current_message: str) -> bool:
    """
    Detecta si el cliente está pidiendo agendar una visita o está listo para hacerlo.
    """
    visit_keywords = [
        "visita", "ver", "conocer", "mostrar", "recorrer", "coordinar", 
        "agendar", "cita", "horario", "cuando puedo", "disponible"
    ]
    
    current_lower = current_message.lower()
    
    # Buscar en el mensaje actual
    for keyword in visit_keywords:
        if keyword in current_lower:
            return True
    
    # Buscar en los últimos mensajes del cliente
    for msg in conversation_history[-3:]:
        if msg.get("role") == "user":
            msg_lower = msg.get("content", "").lower()
            for keyword in visit_keywords:
                if keyword in msg_lower:
                    return True
    
    return False


def analyze_qualification_status(lead_data: dict) -> dict:
    """
    Analiza qué información falta según el protocolo de precalificación.
    
    Returns:
        {
            "ready_for_visit": bool,
            "missing_critical": list,
            "missing_optional": list,
            "next_question_type": str
        }
    """
    # Datos críticos para agendar visita
    critical_fields = {
        "property_interest": lead_data.get("property_context") or lead_data.get("Neighborhood"),
        "purpose": lead_data.get("Intent"),  # mudanza o inversión
        "for_whom": True,  # asumir que es para el cliente si no dice lo contrario
        "timeline": lead_data.get("timeline"),  # cuándo quiere mudarse/comprar
    }
    
    # Datos opcionales pero importantes
    optional_fields = {
        "search_duration": lead_data.get("search_duration"),  # hace cuánto busca
        "financing": lead_data.get("financing_type"),  # ahorro/crédito/venta
        "needs_to_sell": lead_data.get("needs_to_sell"),
        "budget": lead_data.get("Budget")
    }
    
    missing_critical = [k for k, v in critical_fields.items() if not v]
    missing_optional = [k for k, v in optional_fields.items() if not v]
    
    ready_for_visit = len(missing_critical) == 0
    
    # Determinar qué tipo de pregunta hacer siguiente
    next_question_type = None
    if "property_interest" in missing_critical:
        next_question_type = "property_context"
    elif "purpose" in missing_critical:
        next_question_type = "mudanza_or_inversion"
    elif "timeline" in missing_critical:
        next_question_type = "timeline"
    elif "financing" in missing_optional:
        next_question_type = "financing"
    
    return {
        "ready_for_visit": ready_for_visit,
        "missing_critical": missing_critical,
        "missing_optional": missing_optional,
        "next_question_type": next_question_type
    }
