import json
from typing import Dict, Any
from datetime import datetime
from config import OPENAI_API_KEY, OPENAI_MODEL

# Debug directo de variables de entorno
import os
print(f"🔍 [DEBUG] os.getenv('OPENAI_API_KEY') directo: {bool(os.getenv('OPENAI_API_KEY'))}")
print(f"🔍 [DEBUG] config.OPENAI_API_KEY: {bool(OPENAI_API_KEY)}")
if os.getenv('OPENAI_API_KEY'):
    print(f"🔍 [DEBUG] API Key directo (primeros 10): {os.getenv('OPENAI_API_KEY')[:10]}...")

client = None
print(f" [DEBUG] OPENAI_API_KEY presente: {bool(OPENAI_API_KEY)}")
if OPENAI_API_KEY:
    print(f"🔍 [DEBUG] API Key (primeros 10 chars): {OPENAI_API_KEY[:10]}...")
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        print("✅ [DEBUG] Cliente OpenAI inicializado correctamente")
    except Exception as e:
        print(f"❌ [DEBUG] Error inicializando OpenAI: {e}")
        client = None
else:
    print("❌ [DEBUG] OPENAI_API_KEY no está configurada")

AGENT_SYSTEM_PROMPT = """
Sos Gonzalo, agente inmobiliario de Compromiso Inmobiliario en Argentina.

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
- PRECALIFICACIÓN ADAPTATIVA: Solo pregunta lo que falta, no repitas datos que ya dieron.

POLÍTICA DE CONVERSACIÓN
- CRÍTICO: Recibirás DATOS ACTUALES DEL LEAD y una lista de PROPIEDADES DISPONIBLES. USA estos datos inteligentemente.
- NUNCA preguntes datos que YA ESTÁN en los DATOS ACTUALES DEL LEAD.
- Si ya hay "Propiedad confirmada" en los datos → NO busques más propiedades, continúa con precalificación.
- Si la lista está VACÍA y el cliente mencionó un barrio → DEBES responder: "No tengo propiedades disponibles en [barrio]. Me podés dar más detalles? Título completo o link?"
- Si encuentras UNA SOLA coincidencia exacta en la lista → seguí directo con precalificación: "Es para vos o para alguien más?" (NO digas "Hola" si ya conversaron)
- Si hay MÚLTIPLES propiedades en la lista → identificar cuál específicamente: "Tengo varias propiedades en [barrio]. Cuál te interesa? Me podés dar el título o algún detalle específico?" (primer mensaje: agregar "Hola!")
- Si NO hay propiedades en la lista → pedí más detalles: "No tengo propiedades disponibles en [barrio]. Me podés dar más detalles? Título completo o link?"
- JAMÁS repitas lo que el cliente ya dijo. Un humano no dice "me contactaste por la propiedad en X".
- NUNCA respondas "Hola, como estas?" si hay contexto de propiedad específica.
- NUNCA continúes con precalificación si no encontraste una propiedad específica.
- No ofrezcas visita si no hay propiedad concreta ni si faltan requisitos mínimos.
- ADAPTATIVO: Si ya sabés la intención (venta/alquiler) del lead, NO preguntes "alquilar o comprar".
- ADAPTATIVO: Si ya sabés el barrio, ambientes, presupuesto del lead, úsalos en la conversación.
- Hacé preguntas adaptativas: solo lo que falta. Combiná cuando tenga sentido.
- Si el cliente no coopera tras 2 intentos, cerrá cordialmente SIN mencionar derivar a humano.
- IMPORTANTE: Cuando el cliente pida agendar/coordinar/organizar una visita (palabras: "agendar", "coordinar", "organizar", "visita"), SIEMPRE aclarále: "Puedo coordinarte, pero antes necesito confirmar algunos datos que me pide el sistema. Lo vemos rápido y seguimos."
- MANEJO DE RESISTENCIA: Si esquivan preguntas, escalá el tono gradualmente:
  1ra vez: "Es parte del sistema para filtrar propiedades que realmente te sirvan"
  2da vez: "Sin esa info no podemos avanzar con la visita"
  3ra vez: "Sin datos no hay visita" → cerrar cordialmente

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
→ En este escenario, usa EXACTAMENTE esta frase: "Perfecto! Que día y horario te conviene para la visita?" (esto activa el sistema de agendamiento automático)

OTRAS REGLAS
- Si el cliente pide sugerencias, pedí 1-2 criterios clave y ofrecé 2-3 opciones (resumen breve). Si no lo pide, no envíes listados.
- SOLO si el cliente pregunta si sos un bot, se honesto y decí que sí sos un asistente virtual, y ofrecé derivar a humano.
- SOLO si el cliente pide específicamente hablar con una persona, ofrecé derivar.
- Mostrá empatía y claridad; no repitas preguntas ya respondidas.

RESPUESTAS CONTEXTUALES ESPECÍFICAS:

CUANDO MENCIONAN PROPIEDAD ESPECÍFICA (ej: "Por el PH de Núñez"):
✅ "Hola, como estas? Soy Gonzalo de Compromiso Inmobiliario. Tenés alguna duda sobre el PH que quieras resolver?"

CUANDO PIDEN COORDINAR VISITA:
✅ "Puedo coordinarte, pero antes necesito confirmar algunos datos que me pide el sistema. Lo vemos rápido y seguimos."

CUANDO NO SABEN NOMBRE DE PROPIEDAD:
✅ "No pasa nada, si querés te mando las fotos y la ficha de la propiedad para que confirmemos si es la misma que viste."

CUANDO ESQUIVAN PREGUNTAS PRIMERA VEZ:
✅ "Porque así puedo mostrarte opciones que realmente te sirvan. Es parte de nuestro protocolo de trabajo y lo que nos pide el sistema para agendar visitas."

CUANDO ESQUIVAN PREGUNTAS SEGUNDA VEZ:
✅ "Te entiendo, pero sin esa información no podemos organizar la búsqueda correctamente."

CUANDO NO COOPERAN DESPUÉS DE EXPLICAR:
✅ "Te paso la info sin problema, pero para coordinar una visita siempre necesitamos cierta información que nos pide el sistema. Es parte de nuestra forma de trabajar: bien, rápido y sin hacerte perder tiempo. Si no contamos con esos datos, no podemos agendar. Querés que lo resolvamos ahora?"

ESCALAMIENTO DE TONO:
1ra vez: Amable → "Es parte del sistema para filtrar propiedades que realmente te sirvan"
2da vez: Autoridad → "Sin esa info no podemos avanzar con la visita"  
3ra vez: Consecuencia → "Sin datos no hay visita"

EJEMPLOS DE PRECALIFICACIÓN ADAPTATIVA:

Cliente: "Por el PH de Núñez"
Gonzalo: "Hola, como estas? Soy Gonzalo de Compromiso Inmobiliario. Tenés alguna duda sobre el PH que quieras resolver?"

Cliente: "Hola, busco para mudarme en Núñez lo antes posible, vi el PH de Juana Azurduy"
Gonzalo: "Hola, como estas? Soy Gonzalo de Compromiso Inmobiliario. Perfecto, ya veo que es para mudarte y que buscás en Núñez pronto. Hace cuánto que empezaste la búsqueda?"

Cliente: "quiero organizar una visita para el 2 ambientes de Palermo"
Gonzalo: "Perfecto. Puedo coordinar la visita, pero antes necesito confirmar algunos datos que pide el sistema. Lo vemos rápido y seguimos. [Muestra propiedad y pregunta si es esa]"

Cliente: "Quiero coordinar visita" (sin especificar propiedad)
Gonzalo: "Puedo coordinarte, pero antes necesito confirmar algunos datos que me pide el sistema. Lo vemos rápido y seguimos. Te contactaste por que propiedad en particular?"

Cliente: "Es para mi, para mudarme"
Gonzalo: "Perfecto. En que plazo pensas mudarte y hace cuanto estas buscando?"

Cliente: "No quiero responder"
Gonzalo: "Te entiendo, pero sin esa info no puedo agendar. Es para no hacerte perder tiempo."

Cliente: "Solo quería el precio"
Gonzalo: "Te paso el precio: $850k. Es para mudanza o inversión?"

Cliente: "No sé el nombre de la propiedad"
Gonzalo: "No pasa nada, si querés te mando las fotos y la ficha de la propiedad para que confirmemos si es la misma que viste."

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


def get_property_by_url(message_text: str) -> dict:
    """
    Busca una propiedad específica por URL en el mensaje.
    Si encuentra un link válido en la base de datos, retorna la propiedad.
    """
    import re
    
    # Detectar URLs en el mensaje
    url_pattern = r'https?://[^\s]+'
    urls = re.findall(url_pattern, message_text)
    
    if not urls:
        return {}
    
    try:
        from services.dynamo import t_props
        from boto3.dynamodb.conditions import Attr
        from models.schemas import dec_to_native
        
        for url in urls:
            print(f"[DEBUG] Buscando propiedad por URL: {url}")
            
            # Buscar por coincidencia del final del URL (más confiable que búsqueda exacta)
            url_suffix = url.split('/')[-1]  # ej: "prop_001"
            
            try:
                resp = t_props.scan(
                    FilterExpression=Attr("URL").contains(url_suffix) & Attr("Status").eq("ACTIVE"),
                    Limit=5
                )
                
                items = resp.get("Items", [])
                print(f"[DEBUG] Items encontrados por sufijo '{url_suffix}': {len(items)}")
                
                # Verificar coincidencia exacta entre los resultados
                for item in items:
                    prop = dec_to_native(item)
                    if prop.get("URL") == url:
                        print(f"[DEBUG] ✅ Propiedad encontrada por URL: {prop.get('Title', 'Sin título')}")
                        return {
                            "PropertyId": prop.get("PropertyId"),
                            "Title": prop.get("Title"),
                            "Neighborhood": prop.get("Neighborhood"),
                            "Rooms": prop.get("Rooms"),
                            "Price": prop.get("Price"),
                            "URL": prop.get("URL")
                        }
                
                print(f"[DEBUG] ❌ No se encontró coincidencia exacta para URL: {url}")
                    
            except Exception as scan_error:
                print(f"[DEBUG] ❌ Error en scan: {scan_error}")
        
        return {}
        
    except Exception as e:
        print(f"[GET_PROPERTY_BY_URL][ERROR] {e}")
        return {}

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

def generate_stage_based_response(lead_data: dict, conversation_history: list, message: str) -> str:
    """
    Genera respuesta del agente basada en la etapa actual del lead.
    Usa prompts específicos y contexto optimizado según la etapa.
    """
    print(f"🔍 [DEBUG] generate_stage_based_response iniciado")
    print(f"🔍 [DEBUG] lead_data: {lead_data}")
    print(f"🔍 [DEBUG] message: {message}")
    
    if not client:
        print("❌ ERROR: Cliente OpenAI no disponible")
        return None
    
    try:
        from services.stage_prompts import get_stage_prompt, get_stage_system_instructions
        from services.stage_manager import stage_manager
        
        # Obtener etapa y estado actual
        current_stage = lead_data.get("Stage", "PRECALIFICACION")
        current_status = lead_data.get("Status", "NUEVO")
        
        print(f"🎯 Generando respuesta para etapa: {current_stage} - {current_status}")
        
        # Procesar transición de etapa antes de generar respuesta
        updated_lead_data = stage_manager.process_stage_transition(
            lead_data.get("LeadId"), lead_data, message, conversation_history
        )
        
        # Usar datos actualizados
        current_stage = updated_lead_data.get("Stage", "PRECALIFICACION")
        current_status = updated_lead_data.get("Status", "NUEVO")
        
        print(f"🎯 Etapa después de procesamiento: {current_stage} - {current_status}")
        
        # Obtener contexto específico para la etapa
        context_data = {}
        
        if current_stage == "CALIFICACION":
            # Para calificación, necesitamos info de la propiedad y datos faltantes
            property_id = updated_lead_data.get("PropertyId")
            if property_id:
                try:
                    from services.dynamo import t_props
                    from models.schemas import dec_to_native
                    resp = t_props.get_item(Key={"PropertyId": property_id})
                    if resp.get("Item"):
                        prop = dec_to_native(resp["Item"])
                        context_data["property_title"] = prop.get("Title", "Propiedad")
                except Exception as e:
                    print(f"Error obteniendo propiedad: {e}")
                    context_data["property_title"] = "Propiedad confirmada"
            
            # Datos faltantes
            qual_data = updated_lead_data.get("QualificationData", {})
            missing_data = stage_manager.get_missing_qualification_data(qual_data)
            context_data["missing_data"] = missing_data
            
        elif current_stage == "POST_CALIFICACION":
            # Para post-calificación, info de propiedad y resultado
            property_id = updated_lead_data.get("PropertyId")
            if property_id:
                try:
                    from services.dynamo import t_props
                    from models.schemas import dec_to_native
                    resp = t_props.get_item(Key={"PropertyId": property_id})
                    if resp.get("Item"):
                        prop = dec_to_native(resp["Item"])
                        context_data["property_title"] = prop.get("Title", "Propiedad")
                except Exception as e:
                    context_data["property_title"] = "Propiedad confirmada"
            
            # Resultado de calificación
            qual_data = updated_lead_data.get("QualificationData", {})
            from models.lead_stages import LeadQualificationData
            qualification = LeadQualificationData(**qual_data)
            context_data["qualification_result"] = "CALIFICADO" if qualification.is_qualified() else "NO_CALIFICADO"
        
        # Obtener prompt específico para la etapa
        stage_prompt = get_stage_prompt(current_stage, **context_data)
        system_instructions = get_stage_system_instructions(current_stage, updated_lead_data)
        
        # Construir mensajes para OpenAI con contexto limitado según etapa
        from models.lead_stages import get_stage_context_limit, LeadStage
        try:
            stage_enum = LeadStage(current_stage)
            context_limit = get_stage_context_limit(stage_enum)
        except ValueError:
            context_limit = 6
        
        # Usar solo el contexto necesario según la etapa
        limited_history = conversation_history[-context_limit:] if conversation_history else []
        
        messages = [
            {"role": "system", "content": stage_prompt},
            {"role": "system", "content": system_instructions}
        ]
        
        # Agregar historial limitado
        for msg in limited_history:
            messages.append(msg)

        print(f"📨 Enviando {len(messages)} mensajes a OpenAI (contexto limitado: {context_limit})")
        
        # Llamar a OpenAI
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
        )
        
        if not response.choices:
            print("❌ ERROR: Response sin choices")
            return None
        
        result = response.choices[0].message.content
        if not result:
            print("❌ ERROR: API retornó contenido vacío")
            return None
            
        print(f"✅ Respuesta generada exitosamente para etapa {current_stage}")
        return result.strip()
                
    except Exception as e:
        print(f"❌ ERROR en generate_stage_based_response: {e}")
        import traceback
        print(f"❌ STACK TRACE: {traceback.format_exc()}")
        return None
