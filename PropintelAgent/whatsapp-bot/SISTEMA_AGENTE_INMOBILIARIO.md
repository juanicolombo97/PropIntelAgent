# 🏠 Sistema de Agente Inmobiliario Inteligente

## 🚀 Transformación Completa del Bot

El bot de WhatsApp ha sido **completamente transformado** de un asistente robótico a un **agente inmobiliario profesional** que simula conversaciones reales.

## 🎯 Características Principales

### 1. **Agente Inmobiliario Real: "Gonzalo"**
- ✅ **Personalidad humana**: Habla como un agente real de Compromiso Inmobiliario
- ✅ **Sin emojis**: Para no parecer un bot
- ✅ **Lenguaje argentino natural**: "como estas?" en lugar de "¿cómo estás?"
- ✅ **Contexto completo**: Recuerda toda la conversación previa

### 2. **Protocolo de Precalificación Adaptativa**
Sigue el protocolo profesional pero de manera inteligente:

#### **Origen y Motivación**
- Por cuál propiedad te contactaste?
- Esta propiedad sería para vos o para alguien más?
- Estás buscando para mudarte o invertir?
- Tenés un tiempo definido o urgencia para definir tu compra?
- Hace cuánto comenzaste tu búsqueda?

#### **Capacidad Económica**
- Necesitás vender para comprar?
- Si necesitás vender, esa propiedad ya está en venta? hace cuánto?
- Si tu compra es con crédito, ya está aprobado? de qué banco es?

#### **Captación**
- Podemos ofrecerte una tasación gratuita?

### 3. **Inteligencia Contextual**
- 🧠 **Analiza toda la conversación** antes de responder
- 🎯 **Solo pregunta lo que falta** (precalificación adaptativa)
- 🏠 **Detecta automáticamente** la propiedad específica de interés
- ⚡ **Combina preguntas** cuando tiene sentido

## 💬 Ejemplos de Conversación Real

### Conversación Típica

**Cliente:** "Hola, me interesa la propiedad de Núñez"

**Gonzalo:** "Hola! Soy Gonzalo de Compromiso Inmobiliario. Me escribiste por el departamento de Núñez. Decime como te puedo ayudar?"

**Cliente:** "Quiero coordinar visita"

**Gonzalo:** "Por el departamento de Núñez puedo coordinarte visita, pero antes necesito confirmar unos datos que pide el sistema. Lo resolvemos rápido y seguimos."

**Cliente:** "Ok"

**Gonzalo:** "La propiedad por la que estas consultando, seria para vos o para alguien mas y la estas buscando para vivir o como inversion?"

**Cliente:** "Para mí para vivir"

**Gonzalo:** "Bien, en qué plazo te gustaría mudarte y hace cuánto empezaste a buscar?"

**Cliente:** "Cuando encuentre, hace 3 meses"

**Gonzalo:** "Perfecto. Necesitás vender algo para poder comprar o ya contás con el dinero?"

**Cliente:** "Ya tengo el dinero"

**Gonzalo:** "Genial, podemos verla el jueves a las 17 hs, te sirve?"

### Precalificación Adaptativa en Acción

**Cliente:** "Hola, busco para mudarme urgente, tengo 200k, vi el depto de Palermo"

**Gonzalo:** "Hola! Soy Gonzalo de Compromiso Inmobiliario. Perfecto, veo que es para mudarte urgente en Palermo con 200k. Hace cuánto empezaste la búsqueda y necesitás vender algo para comprar?"

*(Nota: Solo preguntó lo que faltaba, no repitió lo que el cliente ya dijo)*

## 🔧 Arquitectura Técnica

### Flujo Principal
```
Mensaje WhatsApp → Historial Completo → IA Conversacional → Respuesta Humana
                     ↓
                  Extracción de Datos Estructurados
                     ↓
                  Actualización Lead DB
```

### Componentes Clave

#### 1. **`generate_agent_response()`**
- Usa OpenAI con prompt de agente inmobiliario
- Recibe toda la conversación como contexto
- Incluye datos del lead y propiedad específica
- Genera respuestas 100% humanas

#### 2. **`get_conversation_history()`**
- Obtiene historial completo de DynamoDB
- Formatea para OpenAI (user/assistant)
- Mantiene contexto de hasta 20 mensajes

#### 3. **`get_property_by_context()`**
- Identifica automáticamente la propiedad consultada
- Busca por palabras clave en mensaje y base de datos
- Proporciona contexto específico al agente

#### 4. **Precalificación Adaptativa**
- Detecta qué información ya se proporcionó
- Solo pregunta datos faltantes
- Combina preguntas cuando es natural

## 🎛️ Configuración del Sistema

### Variables de Entorno Necesarias
```bash
# OpenAI para IA conversacional
OPENAI_API_KEY=tu_api_key
OPENAI_MODEL=gpt-4o-mini

# DynamoDB para persistencia
LEADS_TABLE=propintel-leads
MESSAGES_TABLE=propintel-messages  
PROPERTIES_TABLE=propintel-properties
VISITS_TABLE=propintel-visits
```

### Personalización del Agente
En `services/ai.py` → `AGENT_SYSTEM_PROMPT`:
- Cambiar nombre del agente
- Ajustar personalidad
- Modificar protocolo de precalificación
- Personalizar ejemplos de conversación

## 📊 Ventajas del Nuevo Sistema

### VS Sistema Anterior

| **Aspecto** | **Antes** | **Ahora** |
|-------------|-----------|-----------|
| **Conversación** | Robótica, con emojis | Humana, profesional |
| **Contexto** | Solo mensaje actual | Toda la conversación |
| **Preguntas** | Todas las preguntas siempre | Solo lo que falta |
| **Personalidad** | Bot genérico | Gonzalo, agente inmobiliario |
| **Flexibilidad** | Rígido, reglas fijas | Adaptativo, inteligente |

### Beneficios de Negocio

✅ **Mayor conversión**: Los clientes no saben que es un bot
✅ **Mejor calificación**: Protocolo profesional aplicado inteligentemente  
✅ **Menos fricción**: No repite preguntas ya respondidas
✅ **Experiencia superior**: Conversaciones naturales y contextuales
✅ **Escalabilidad**: Un agente virtual que trabaja 24/7

## 🚦 Estados de Precalificación

El sistema rastrea automáticamente:

- **Datos Críticos**: Propiedad, propósito (mudanza/inversión), para quién
- **Datos Importantes**: Timeline, financiación, presupuesto
- **Estado de Visita**: Listo para agendar, necesita más datos

## 🔄 Flujo de Agendamiento

1. **Cliente expresa interés** en visita
2. **Sistema verifica** datos críticos completos
3. **Si falta información**: Gonzalo pregunta lo necesario
4. **Si está completo**: Propone horarios disponibles
5. **Confirmación**: Agenda en sistema y confirma al cliente

## 📱 Ejemplos de Manejo de Casos

### Cliente No Cooperativo
**Cliente:** "No quiero responder eso"
**Gonzalo:** "Te entiendo, pero sin esa información no puedo agendar la visita. Es parte de nuestra forma de trabajar para no hacerte perder tiempo."

### Cliente Impaciente
**Cliente:** "Solo quiero ver la propiedad ya!"
**Gonzalo:** "Entiendo que tengas urgencia. El sistema me pide estos datos para agendar cualquier visita. Son solo 2 preguntas y coordinamos."

### Información Parcial
**Cliente:** "Es para mí, quiero mudarme"
**Gonzalo:** "Perfecto. En qué plazo te gustaría mudarte y hace cuánto empezaste a buscar?"

## 🛠️ Mantenimiento y Mejoras

### Monitoring Recomendado
- Logs de conversaciones para mejorar prompts
- Métricas de conversión (visitas agendadas)
- Feedback de clientes sobre experiencia

### Futuras Mejoras
- Integración con calendario real para disponibilidad
- Memoria extendida de preferencias del cliente
- Análisis de sentiment para ajustar tono

---

**🎯 Estado: Listo para Producción**
**🚀 El sistema está completamente implementado y listo para entregar al cliente**

El bot ya no parece un bot - es Gonzalo, tu agente inmobiliario profesional que trabaja 24/7.