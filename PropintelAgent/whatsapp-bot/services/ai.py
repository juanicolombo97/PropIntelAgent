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

AGENT_SYSTEM_PROMPT = """Eres Gonzalo, agente inmobiliario de Compromiso Inmobiliario en Argentina.

REGLAS OBLIGATORIAS - NUNCA LAS VIOLES:
1. JAMÁS uses signos de pregunta invertidos (¿). SIEMPRE escribe "como estas?" NUNCA "¿cómo estás?"
2. JAMÁS uses emojis.
3. JAMÁS ofrezcas derivar a humano por tu cuenta.
4. Habla como una persona real que trabaja en inmobiliaria hace años.
5. CRÍTICO: Si el cliente menciona una propiedad específica en su primer mensaje, JAMÁS respondas "Hola, como estas?". Reconocé la propiedad inmediatamente.

FORMATO CORRECTO:
- "Hola, como estas?"
- "Que zona te gusta?"
- "Necesitas vender para comprar?"
- "Es para vos o para otra persona?"

FORMATO INCORRECTO (NUNCA HAGAS ESTO):
- "Hola, ¿cómo estás?" ❌
- "¿Qué zona te gusta?" ❌
- "¿Es para vos o para otra persona?" ❌
- "Hola 👋" ❌

CRÍTICO: Cada vez que uses ¿ o emojis, estás cometiendo un error grave. Escribe SIEMPRE sin ¿ y sin emojis.

TONO:
- Profesional y cercano, humano
- Español argentino, natural y directo
- Frases cortas, una sola pregunta por mensaje cuando sea posible

OBJETIVO
- Llevar una conversación natural para precalificar y, solo si corresponde, proponer visita.
- NUNCA ofrezcas derivar a un humano por tu cuenta. Solo si el cliente pregunta específicamente si sos un bot o pide hablar con una persona.

POLÍTICA DE CONVERSACIÓN
- CRÍTICO: Siempre recibirás una lista de PROPIEDADES DISPONIBLES filtradas. USA esta lista para identificar exactamente de qué propiedad habla el cliente.
- Si la lista está VACÍA y el cliente mencionó un barrio → DEBES responder: "No tengo propiedades disponibles en [barrio]. Me podés dar más detalles? Título completo o link?"
- Si encuentras UNA SOLA coincidencia exacta en la lista → seguí directo con precalificación: "Es para vos o para alguien más?" (NO digas "Hola" si ya conversaron)
- Si hay MÚLTIPLES propiedades en la lista → identificar cuál específicamente: "Tengo varias propiedades en [barrio]. Cuál te interesa? Me podés dar el título o algún detalle específico?" (primer mensaje: agregar "Hola!")
- Si NO hay propiedades en la lista → pedí más detalles: "No tengo propiedades disponibles en [barrio]. Me podés dar más detalles? Título completo o link?"
- JAMÁS repitas lo que el cliente ya dijo. Un humano no dice "me contactaste por la propiedad en X".
- NUNCA respondas "Hola, como estas?" si hay contexto de propiedad específica.
- NUNCA continúes con precalificación si no encontraste una propiedad específica.
- No ofrezcas visita si no hay propiedad concreta ni si faltan requisitos mínimos.
- No preguntes "alquilar o comprar" si ya se deduce del contexto (ej: dijo "quiero comprar").
- Hacé preguntas adaptativas: solo lo que falta. Combiná cuando tenga sentido.
- Si el cliente no coopera tras 2 intentos, cerrá cordialmente SIN mencionar derivar a humano.

REQUISITOS MÍNIMOS PARA AGENDAR VISITA
1) Referencia clara de la propiedad: link, dirección, código, o barrio + detalle. Si no hay propiedad concreta → no se agenda. Solo sugerí opciones si el cliente lo pide.
2) Para quién es la compra: confirmar si es para él/ella u otra persona. La visita debe ser con quien decide.
3) Motivo de búsqueda: mudanza o inversión.
4) Plazo y antigüedad de búsqueda: en cuánto tiempo piensa concretar y hace cuánto busca.
5) Capacidad económica:
   - Necesita vender para comprar? Si sí, confirmar que su propiedad esté publicada (idealmente link).
   - Cómo financia: ahorro, crédito o mixto. Si crédito, confirmar preaprobación (banco y monto).
   - Si no tiene fondos ni crédito aprobado → no se agenda.
6) Listo para cerrar: "Si la propiedad cumple lo que buscas, estas en condiciones de avanzar o hay algo que te frene?" Debe responder que sí (o condiciones ya cumplidas).

CONDICIONES PARA NO AGENDAR
- No tiene fondos ni crédito preaprobado.
- Necesita vender pero aún no publicó su propiedad.
- El decisor real no va a la visita.
- No brinda info clave para precalificar.
→ En estos casos, cerrá cordialmente, sin ofrecer visita. NO menciones derivar a humano.

CONDICIONES PARA SÍ AGENDAR
- Tiene dinero o crédito preaprobado.
- No depende de vender (o si depende, ya tiene la propiedad publicada en venta).
- La visita la hace quien decide.
- Responde que puede avanzar si le gusta.
→ En este escenario, proponé directamente día y hora concretos (no preguntes abierto). Mantené el tono humano.

OTRAS REGLAS
- Si el cliente pide sugerencias, pedí 1-2 criterios clave y ofrecé 2-3 opciones (resumen breve). Si no lo pide, no envíes listados.
- SOLO si el cliente pregunta si sos un bot, se honesto y decí que sí sos un asistente virtual, y ofrecé derivar a humano.
- SOLO si el cliente pide específicamente hablar con una persona, ofrecé derivar.
- Mostrá empatía y claridad; no repitas preguntas ya respondidas.

EJEMPLOS BREVES (SIN SIGNOS DE PREGUNTA INVERTIDOS)
PRIMER MENSAJE:
Cliente: "Hola buenas te hablo por la propiedad de palermo"
Gonzalo (1 propiedad): "Hola! Es para vos o para alguien más?"
Gonzalo (múltiples propiedades): "Hola! Tengo varias propiedades en Palermo. Cuál te interesa?"
Gonzalo (0 propiedades): "Hola! No tengo propiedades disponibles en Palermo. Me podés dar más detalles?"

CONVERSACIÓN EN CURSO (YA SE SALUDARON):
Cliente: "Había visto un dos ambientes"
Gonzalo (1 propiedad): "Es para vos o para alguien más?" (SIN "Hola")
Gonzalo (múltiples propiedades): "Tengo varias opciones de 2 ambientes. Cuál te interesa?" (SIN "Hola")

EJEMPLO CRÍTICO - CONTEXTO DE CONVERSACIÓN:
✅ PRIMER MENSAJE: "Hola! Es para vos o para alguien más?"
✅ CONVERSACIÓN EN CURSO: "Es para vos o para alguien más?" (SIN saludo)
❌ INCORRECTO: Saludar nuevamente en una conversación en curso

Cliente: "Quiero coordinar visita"
Gonzalo: "Puedo coordinarte, pero antes necesito confirmar algunos datos que me pide el sistema. Lo vemos rápido y seguimos. Te contactaste por que propiedad en particular?"

Cliente: "Es para mi, para mudarme"
Gonzalo: "Perfecto. En que plazo pensas mudarte y hace cuanto estas buscando?"

Cliente: "No quiero responder"
Gonzalo: "Te entiendo, pero sin esa info no puedo agendar. Es para no hacerte perder tiempo."

Cliente: "Sos un bot?"
Gonzalo: "Si, soy un asistente virtual de la inmobiliaria. Si preferis hablar con un asesor humano, te puedo derivar."

Respondé siempre como una persona de inmobiliaria con experiencia. NUNCA como asistente virtual.
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


def get_filtered_properties(lead_data: dict) -> list:
    """
    Obtiene propiedades filtradas según los datos del lead para pasarle a la IA.
    """
    try:
        from services.dynamo import t_props
        from boto3.dynamodb.conditions import Attr
        
        # Construir filtros
        filter_expr = Attr("Status").eq("ACTIVE")
        
        # Filtrar por barrio si está disponible
        neighborhood = lead_data.get("Neighborhood")
        if neighborhood:
            filter_expr = filter_expr & Attr("Neighborhood").eq(neighborhood)
        
        # Filtrar por número de ambientes si está disponible
        rooms = lead_data.get("Rooms")
        if rooms:
            filter_expr = filter_expr & Attr("Rooms").eq(rooms)
        
        # Filtrar por presupuesto si está disponible
        budget = lead_data.get("Budget")
        if budget:
            filter_expr = filter_expr & Attr("Price").lte(budget)
        
        resp = t_props.scan(FilterExpression=filter_expr, Limit=20)
        items = resp.get("Items", [])
        
        # Convertir a formato nativo y simplificar para la IA
        simplified_props = []
        for item in items:
            from models.schemas import dec_to_native
            prop = dec_to_native(item)
            simplified_props.append({
                "PropertyId": prop.get("PropertyId"),
                "Title": prop.get("Title"),
                "Neighborhood": prop.get("Neighborhood"),
                "Rooms": prop.get("Rooms"),
                "Price": prop.get("Price"),
                "URL": prop.get("URL")
            })
        
        return simplified_props
    except Exception as e:
        print(f"[GET_FILTERED_PROPS][ERROR] {e}")
        return []

def get_fallback_properties(lead_data: dict) -> list:
    """
    Obtiene propiedades con criterios relajados para ofrecer alternativas.
    Solo se usa cuando no se encuentra la propiedad específica después de varios intentos.
    """
    try:
        from services.dynamo import t_props
        from boto3.dynamodb.conditions import Attr
        
        # Criterios disponibles
        neighborhood = lead_data.get("Neighborhood")
        rooms = lead_data.get("Rooms")
        budget = lead_data.get("Budget")
        
        # Contar criterios no nulos
        criteria_count = sum([1 for x in [neighborhood, rooms, budget] if x is not None])
        
        # Solo buscar alternativas si hay al menos 2 criterios
        if criteria_count < 2:
            return []
        
        # Buscar propiedades que cumplan al menos 2 de los 3 criterios
        filter_expr = Attr("Status").eq("ACTIVE")
        
        # Si tenemos presupuesto y ambientes, buscar por esos (sin barrio)
        if budget and rooms:
            filter_expr = filter_expr & Attr("Price").lte(budget) & Attr("Rooms").eq(rooms)
        # Si tenemos barrio y ambientes, buscar por esos (sin presupuesto)
        elif neighborhood and rooms:
            filter_expr = filter_expr & Attr("Neighborhood").eq(neighborhood) & Attr("Rooms").eq(rooms)
        # Si tenemos barrio y presupuesto, buscar por esos (sin ambientes)
        elif neighborhood and budget:
            filter_expr = filter_expr & Attr("Neighborhood").eq(neighborhood) & Attr("Price").lte(budget)
        else:
            return []
        
        resp = t_props.scan(FilterExpression=filter_expr, Limit=10)
        items = resp.get("Items", [])
        
        # Convertir a formato nativo y simplificar
        simplified_props = []
        for item in items:
            from models.schemas import dec_to_native
            prop = dec_to_native(item)
            simplified_props.append({
                "PropertyId": prop.get("PropertyId"),
                "Title": prop.get("Title"),
                "Neighborhood": prop.get("Neighborhood"),
                "Rooms": prop.get("Rooms"),
                "Price": prop.get("Price"),
                "URL": prop.get("URL")
            })
        
        return simplified_props
    except Exception as e:
        print(f"[GET_FALLBACK_PROPS][ERROR] {e}")
        return []

def generate_agent_response(conversation_history: list, lead_data: dict, property_context: dict = None) -> str:
    """
    Genera la respuesta del agente usando exclusivamente el LLM con historial.
    No aplica reglas conversacionales hardcodeadas; toda la lógica vive en el prompt.
    """
    # Llamar a OpenAI para generar la respuesta conversacional (si la API está disponible)
    if client:
        try:
            # Obtener propiedades filtradas para pasarle a la IA
            available_properties = get_filtered_properties(lead_data)
            print(f"[DEBUG] Propiedades filtradas encontradas: {len(available_properties)}")
            if available_properties:
                print(f"[DEBUG] Primera propiedad: {available_properties[0].get('Title', 'Sin título')}")
            
            # Contar cuántas veces se ha preguntado por más detalles (aproximación por historial)
            property_detail_requests = 0
            for msg in conversation_history[-6:]:  # Últimos 6 mensajes
                if msg.get("role") == "assistant" and any(word in msg.get("content", "").lower() for word in ["detalles", "link", "dirección", "código"]):
                    property_detail_requests += 1
            
            print(f"[DEBUG] Intentos de obtener detalles: {property_detail_requests}")
            
            # Construir contexto de propiedades disponibles
            property_info = ""
            if available_properties:
                property_info = f"\n🏠 PROPIEDADES DISPONIBLES ({len(available_properties)}):\n"
                for i, prop in enumerate(available_properties[:10], 1):  # Máximo 10 para no saturar
                    title = prop.get("Title", "Sin título")
                    neighborhood = prop.get("Neighborhood", "")
                    rooms = prop.get("Rooms", "")
                    price = prop.get("Price", "")
                    
                    property_info += f"{i}. {title}"
                    if neighborhood:
                        property_info += f" - {neighborhood}"
                    if rooms:
                        property_info += f" - {rooms} amb"
                    if price:
                        try:
                            price_val = float(price)
                            if price_val >= 1000000:
                                price_str = f"${price_val/1000000:.1f}M"
                            elif price_val >= 1000:
                                price_str = f"${int(price_val/1000)}k"
                            else:
                                price_str = f"${int(price_val)}"
                            property_info += f" - {price_str}"
                        except:
                            pass
                    property_info += "\n"
                
                # Determinar si es primer mensaje o conversación en curso
                is_first_message = len(conversation_history) <= 1
                greeting = "Hola! " if is_first_message else ""
                
                if len(available_properties) == 1:
                    property_info += "\n✅ UNA SOLA PROPIEDAD encontrada. Continúa con precalificación."
                    property_info += f"\nRespuesta: '{greeting}Es para vos o para alguien más?'"
                else:
                    property_info += "\nCRÍTICO: Hay MÚLTIPLES propiedades. DEBES identificar cuál específicamente busca el cliente."
                    property_info += f"\nRespuesta: '{greeting}Tengo varias propiedades en {lead_data.get('Neighborhood', 'esa zona')}. Cuál te interesa? Me podés dar el título o algún detalle específico?'"
                    property_info += "\nNO continúes con precalificación hasta saber la propiedad exacta."
            else:
                # No hay propiedades que coincidan con los filtros
                neighborhood = lead_data.get("Neighborhood")
                if neighborhood:
                    # Si ya se pidieron detalles 3+ veces, ofrecer alternativas o cerrar
                    if property_detail_requests >= 3:
                        fallback_properties = get_fallback_properties(lead_data)
                        if fallback_properties:
                            property_info = f"\n🔄 FALLBACK: Después de {property_detail_requests} intentos, ofrecer alternativas."
                            property_info += f"\n🏠 PROPIEDADES ALTERNATIVAS ({len(fallback_properties)}):\n"
                            for i, prop in enumerate(fallback_properties[:5], 1):
                                title = prop.get("Title", "Sin título")
                                prop_neighborhood = prop.get("Neighborhood", "")
                                rooms = prop.get("Rooms", "")
                                price = prop.get("Price", "")
                                
                                property_info += f"{i}. {title}"
                                if prop_neighborhood:
                                    property_info += f" - {prop_neighborhood}"
                                if rooms:
                                    property_info += f" - {rooms} amb"
                                if price:
                                    try:
                                        price_val = float(price)
                                        if price_val >= 1000000:
                                            price_str = f"${price_val/1000000:.1f}M"
                                        elif price_val >= 1000:
                                            price_str = f"${int(price_val/1000)}k"
                                        else:
                                            price_str = f"${int(price_val)}"
                                        property_info += f" - {price_str}"
                                    except:
                                        pass
                                property_info += "\n"
                            property_info += f"\nRespuesta: 'No tenemos esa propiedad específica en {neighborhood}. Te muestro opciones similares que tenemos disponibles:' y luego lista las propiedades."
                        else:
                            # No hay alternativas O no hay suficientes criterios - cerrar conversación
                            property_info = f"\n❌ CERRAR CONVERSACIÓN: Después de {property_detail_requests} intentos sin éxito."
                            property_info += f"\nRespuesta: 'Lamentablemente no tenemos propiedades que coincidan con lo que buscás.'"
                    else:
                        # Primer o segundo intento - seguir pidiendo detalles
                        property_info = f"\n❌ LISTA VACÍA: NO HAY PROPIEDADES en {neighborhood}."
                        property_info += f"\n🚨 RESPUESTA OBLIGATORIA: 'No tengo propiedades disponibles en {neighborhood}. Me podés dar más detalles? Título completo o link?'"
                        property_info += f"\n🚫 PROHIBIDO: NO hagas preguntas de precalificación como 'Es para vos o para alguien más?' cuando la lista está vacía."
                        property_info += f"\n🚫 PROHIBIDO: NO pidas 'dirección exacta' o 'código' (no existen en la base de datos)."
                        property_info += f"\n✅ SOLO pedí: título completo o link (campos que SÍ existen)."
                else:
                    property_info = "\n📋 NO HAY CRITERIOS ESPECÍFICOS aún. Necesitas más información del cliente."

            # Preparar mensajes: prompt de sistema + historial completo (reciente)
            full_system_prompt = AGENT_SYSTEM_PROMPT + property_info
            print(f"[DEBUG] System prompt length: {len(full_system_prompt)}")
            print(f"[DEBUG] Property info: {property_info[:200]}...")
            messages = [{"role": "system", "content": full_system_prompt}]
            
            # Agregar recordatorio de reglas antes del historial
            if len(conversation_history) > 0:
                reminder_content = "RECORDATORIO: NUNCA uses signos de pregunta invertidos (¿) ni emojis. Escribe siempre sin ¿ y sin emojis."
                if not available_properties and lead_data.get("Neighborhood"):
                    reminder_content += f" CRÍTICO: NO hay propiedades en {lead_data.get('Neighborhood')}. DEBES pedir más detalles, NO continúes con precalificación."
                messages.append({
                    "role": "system", 
                    "content": reminder_content
                })
            
            # Limitar a últimos 20 mensajes para contexto suficiente
            for msg in conversation_history[-20:]:
                messages.append(msg)
            
            print(f"[DEBUG] Enviando {len(messages)} mensajes a OpenAI")
            print(f"[DEBUG] Último mensaje del usuario: {conversation_history[-1].get('content', '') if conversation_history else 'N/A'}")
            
            # Debug: Mostrar mensajes que se envían a la API
            print("[DEBUG] === MENSAJES ENVIADOS A API ===")
            for i, msg in enumerate(messages):
                role = msg.get("role", "unknown")
                content = msg.get("content", "")
                print(f"[DEBUG] {i+1}. {role.upper()}: {content[:100]}...")
            print("[DEBUG] === FIN MENSAJES ===")

            response = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                max_completion_tokens=1000
            )
            
            print(f"[DEBUG] Respuesta recibida de OpenAI: '{response.choices[0].message.content}'")
            
            result = response.choices[0].message.content
            if result is None:
                print("[AI][ERROR] API retornó contenido None")
                return None
            
            result = result.strip()
            if not result:
                print("[AI][ERROR] API retornó contenido vacío")
                return None
            
            # Separar múltiples preguntas en mensajes individuales
            if "?" in result and result.count("?") > 1:
                # Dividir por preguntas y limpiar
                parts = result.split("?")
                messages = []
                for part in parts:
                    part = part.strip()
                    if part and not part.endswith("."):
                        messages.append(part + "?")
                    elif part:
                        messages.append(part)
                
                # Si hay múltiples mensajes, devolver solo el primero
                # El webhook se encargará de enviar los siguientes
                if len(messages) > 1:
                    # Guardar los mensajes restantes en el lead para enviarlos después
                    # Devolver el primer mensaje como string normal
                    return messages[0]
            
            return result
        except Exception as e:
            print(f"[AGENT_RESPONSE][ERROR] {e}")
            return None

    # Si no hay cliente disponible, no responder nada
    return None


