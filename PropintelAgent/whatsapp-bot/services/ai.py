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

AGENT_SYSTEM_PROMPT = """Sos Gonzalo, un agente inmobiliario profesional de Compromiso Inmobiliario en Argentina. 

PERSONALIDAD Y ESTILO:
- Profesional pero cercano, como un agente real
- Usás lenguaje natural argentino sin ser demasiado formal
- NUNCA usás signos de pregunta invertidos (¿) - escribís "como estas?" NO "¿como estás?"
- NUNCA usás emojis (el cliente va a pensar que sos un bot)
- Sonás como una persona real, no como un asistente virtual

TU OBJETIVO: Precalificar al cliente y agendar visitas útiles siguiendo el protocolo.

PROTOCOLO DE PRECALIFICACION (en orden - ADAPTATIVO):
1. ORIGEN Y MOTIVACIÓN:
   - Por cuál propiedad te contactaste?
   - Esta propiedad sería para vos o para alguien más?
   - Estás buscando para mudarte o invertir?
   - Tenés un tiempo definido o urgencia para definir tu compra?
   - Hace cuánto comenzaste tu búsqueda?

2. CAPACIDAD ECONÓMICA:
   - Necesitás vender para comprar?
   - Si necesitás vender, esa propiedad ya está en venta? hace cuánto? me pasas el link?
   - Si tu compra es con crédito, ya está aprobado? de qué banco es?

3. CAPTACIÓN:
   - Podemos ofrecerte una tasación gratuita?

REGLAS CRÍTICAS:
- PRECALIFICACIÓN ADAPTATIVA: Solo preguntá lo que falta según lo que ya respondieron
- Si quieren agendar sin dar info: explicá que el sistema te pide datos para agendar
- Si no cooperan después de 2 intentos: cerrá cordialmente
- Combiná preguntas cuando tenga sentido: "La propiedad sería para vos y la idea es mudarte o invertir?"

EJEMPLOS DE CONVERSACIÓN:

Inicio típico:
Cliente: "Hola, me interesa la propiedad de Núñez"
Gonzalo: "Hola! Soy Gonzalo de Compromiso Inmobiliario. Me escribiste por el departamento de Núñez. Decime como te puedo ayudar?"

Si piden coordinar:
Cliente: "Quiero coordinar visita"
Gonzalo: "Por el departamento de Núñez puedo coordinarte visita, pero antes necesito confirmar unos datos que pide el sistema. Lo resolvemos rápido y seguimos."

Precalificación adaptativa:
Cliente: "Es para mí, para mudarme"
Gonzalo: "Perfecto. En qué plazo te gustaría mudarte y hace cuánto empezaste a buscar?"

Si no cooperan:
Cliente: "No quiero responder eso"
Gonzalo: "Te entiendo, pero sin esa información no puedo agendar la visita. Es parte de nuestra forma de trabajar para no hacerte perder tiempo."

NUNCA escribas como robot. Sonás como una persona que trabajo en inmobiliaria hace años."""

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
    Genera una respuesta como agente inmobiliario basada en toda la conversación.
    Funciona con y sin OpenAI usando lógica inteligente.
    """
    # Analizar el último mensaje del usuario
    last_user_message = ""
    for msg in reversed(conversation_history):
        if msg.get("role") == "user":
            last_user_message = msg.get("content", "").lower()
            break
    
    # Detectar si es el primer mensaje
    is_first_message = len(conversation_history) == 0 or (
        len(conversation_history) == 1 and conversation_history[0].get("role") == "user"
    )
    
    # Detectar mención de propiedad específica
    property_mentioned = any(word in last_user_message for word in ["propiedad", "departamento", "casa", "ph", "monoambiente"])
    neighborhood_mentioned = any(word in last_user_message for word in ["nuñez", "palermo", "belgrano", "recoleta", "san telmo"])
    
    # RESPUESTAS BASADAS EN CONTEXTO Y REGLAS
    
    # Primera interacción con mención de propiedad o segunda interacción que menciona propiedad específica
    if (is_first_message and (property_mentioned or neighborhood_mentioned)) or \
       (len(conversation_history) == 2 and (property_mentioned or neighborhood_mentioned)):
        
        neighborhood = None
        
        # Extraer barrio mencionado
        barrios = {
            "nuñez": "Núñez", "palermo": "Palermo", "belgrano": "Belgrano", 
            "recoleta": "Recoleta", "san telmo": "San Telmo", "puerto madero": "Puerto Madero",
            "villa crespo": "Villa Crespo", "caballito": "Caballito"
        }
        
        for barrio_key, barrio_nombre in barrios.items():
            if barrio_key in last_user_message:
                neighborhood = barrio_nombre
                break
        
        # Si es el primer mensaje
        if is_first_message:
            if neighborhood:
                return f"Hola! Soy Gonzalo de Compromiso Inmobiliario. Me escribiste por la propiedad de {neighborhood}. Decime como te puedo ayudar?"
            else:
                return "Hola! Soy Gonzalo de Compromiso Inmobiliario. Me escribiste por una propiedad. Decime como te puedo ayudar?"
        
        # Si es el segundo mensaje aclarando la propiedad
        elif len(conversation_history) == 2:
            if neighborhood:
                return f"Perfecto! Me escribiste por la propiedad de {neighborhood}. Decime, esta propiedad sería para vos o para alguien más?"
            else:
                return "Entiendo, me contactaste por una propiedad. Decime, sería para vos o para alguien más?"
    
    # Respuesta a solicitud de visita
    if any(word in last_user_message for word in ["visita", "ver", "conocer", "coordinar", "agendar"]):
        missing = lead_data.get("Missing", [])
        if missing:
            return "Me gustaría coordinarte la visita, pero antes necesito confirmar unos datos que pide el sistema. Lo resolvemos rápido y seguimos. Por cuál propiedad específica te contactaste?"
        else:
            return "Perfecto! Puedo coordinarte la visita. Que día y horario te viene bien?"
    
    # Si OpenAI está disponible, usar IA
    if client:
        try:
            # Construir contexto
            property_info = ""
            if property_context:
                prop_title = property_context.get("Title", "la propiedad")
                prop_neighborhood = property_context.get("Neighborhood", "")
                property_info = f"\nPROPIEDAD: {prop_title}"
                if prop_neighborhood:
                    property_info += f" en {prop_neighborhood}"
            
            messages = [
                {"role": "system", "content": AGENT_SYSTEM_PROMPT + property_info}
            ]
            
            # Agregar historial reciente
            for msg in conversation_history[-6:]:
                messages.append(msg)
            
            response = client.chat.completions.create(
                model=OPENAI_MODEL,
                temperature=0.7,
                messages=messages,
                max_tokens=150
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"[AGENT_RESPONSE][ERROR] {e}")
            # Continuar con lógica de reglas si falla OpenAI
    
    # LÓGICA DE REGLAS PARA PRECALIFICACIÓN
    missing = lead_data.get("Missing", [])
    
    # Preguntar por datos faltantes siguiendo el protocolo
    if "Intent" in missing:
        return "Para ayudarte mejor, me decis si estás buscando para alquilar o comprar?"
    
    if "Neighborhood" in missing:
        return "En qué zona o barrio te gustaría?"
    
    # Si mencionan que es para mudanza o inversión
    if any(word in last_user_message for word in ["mudarme", "mudanza", "vivir"]):
        return "Perfecto, es para mudarte. En qué plazo te gustaría mudarte y hace cuánto empezaste a buscar?"
    
    if any(word in last_user_message for word in ["inversion", "invertir", "negocio"]):
        return "Entiendo, es para inversión. Tenes experiencia invirtiendo en inmuebles?"
    
    # Respuestas según contexto de información disponible
    if not missing:  # Lead calificado
        return "Perfecto! Con estos datos puedo mostrarte las mejores opciones disponibles. Te paso algunas propiedades que pueden interesarte y coordinamos visita."
    
    # Respuesta por defecto contextual
    if is_first_message:
        return "Hola! Soy Gonzalo de Compromiso Inmobiliario. Como puedo ayudarte hoy?"
    
    return "Entiendo. Contame un poco más para poder ayudarte mejor."


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
