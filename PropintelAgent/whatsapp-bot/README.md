# PropIntel WhatsApp Bot

Bot de WhatsApp inteligente para PropIntel que ayuda a los usuarios a encontrar propiedades inmobiliarias.

## 🏗️ Estructura del Proyecto

```
whatsapp-bot/
├─ app.py                  # FastAPI app + handler Lambda
├─ config.py               # Variables de entorno y constantes
├─ routers/
│  ├─ __init__.py
│  └─ webhook.py           # Endpoints de webhook y lectura
├─ services/
│  ├─ __init__.py
│  ├─ dynamo.py            # Acceso a DynamoDB
│  ├─ ai.py                # Extracción de slots con OpenAI
│  └─ matching.py          # Matching de propiedades
├─ models/
│  ├─ __init__.py
│  └─ schemas.py           # Modelos y tipos de datos
├─ utils/
│  ├─ __init__.py
│  └─ time.py              # Utilidades de tiempo
├─ requirements.txt
├─ build.sh                # Script de empaquetado
└─ README.md
```

## 🚀 Características

- **Extracción inteligente de información**: Usa OpenAI para extraer datos estructurados de mensajes de WhatsApp
- **Matching de propiedades**: Algoritmo de puntuación para encontrar las mejores propiedades
- **Calificación automática de leads**: Verifica si un lead cumple los criterios mínimos
- **Integración con DynamoDB**: Almacenamiento persistente de leads, mensajes y propiedades
- **API REST**: Endpoints para consulta de datos y administración

## 📋 Dependencias

- **FastAPI**: Framework web para la API
- **Mangum**: Adaptador para AWS Lambda
- **Boto3**: SDK de AWS para DynamoDB
- **OpenAI**: API para extracción de información
- **Uvicorn**: Servidor ASGI

## 🔧 Configuración

### Variables de Entorno

```bash
# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# DynamoDB Tables
LEADS_TABLE=propintel-leads
MESSAGES_TABLE=propintel-messages
PROPERTIES_TABLE=propintel-properties
VISITS_TABLE=propintel-visits

# OpenAI
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Configuración
MIN_MATCH_SCORE=0.7
MAX_PROPERTIES_TO_SHOW=3

# Admin Panel
ADMIN_API_KEY=your_admin_api_key_here

## 🏃‍♂️ Desarrollo Local

1. **Instalar dependencias**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Ejecutar servidor local**:
   ```bash
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Probar endpoints**:
   - Health check: `GET /`
   - Webhook: `POST /api/v1/webhook`
   - Lead info: `GET /api/v1/lead?lead_id=123`
   - Messages: `GET /api/v1/messages?lead_id=123`

## 📦 Despliegue

### AWS Lambda

1. **Construir paquete**:
   ```bash
   ./build.sh
   ```

2. **Subir a AWS Lambda**:
   - Runtime: Python 3.12
   - Handler: `app.handler`
   - Timeout: 30 segundos
   - Memory: 512 MB

### Docker (Opcional)

```bash
docker build -t propintel-bot .
docker run -p 8000:8000 propintel-bot
```

## 🔄 Flujo de Trabajo

1. **Usuario envía mensaje** → Webhook recibe en `/api/v1/webhook`
2. **Extracción de slots** → OpenAI analiza el mensaje
3. **Actualización de lead** → Se guarda/actualiza en DynamoDB
4. **Matching de propiedades** → Se buscan propiedades coincidentes
5. **Respuesta inteligente** → Se genera respuesta personalizada
6. **Almacenamiento** → Se guarda el mensaje de respuesta

## 📊 Endpoints

### Webhook
- `POST /api/v1/webhook` - Endpoint principal de Twilio

### Lectura
- `GET /api/v1/lead?lead_id={id}` - Información de lead
- `GET /api/v1/messages?lead_id={id}&limit={n}` - Mensajes de lead
- `GET /api/v1/properties` - Lista de propiedades
- `GET /api/v1/visits?lead_id={id}` - Visitas de lead

### Salud
- `GET /` - Health check
- `GET /health` - Verificación de estado

## 🤖 Funcionalidades de IA

### Extracción de Slots
- Presupuesto (mínimo y máximo)
- Número de habitaciones y baños
- Ubicación preferida
- Tipo de propiedad
- Fecha de mudanza
- Preferencias adicionales

### Matching de Propiedades
- Algoritmo de puntuación ponderada
- Coincidencia de presupuesto (40%)
- Coincidencia de ubicación (30%)
- Coincidencia de habitaciones (20%)
- Coincidencia de baños (10%)

### Calificación de Leads
- Verificación de presupuesto mínimo/máximo
- Validación de información requerida
- Estado de calificación automático

## 🛠️ Mantenimiento

### Logs
- Los errores se registran en CloudWatch
- Información de debugging disponible en logs

### Monitoreo
- Endpoint de salud para verificación
- Métricas de DynamoDB
- Logs de OpenAI

### Escalabilidad
- Arquitectura serverless con Lambda
- DynamoDB auto-scaling
- Sin estado persistente en memoria

## 📝 Notas de Desarrollo

- **Fallback sin OpenAI**: Si no hay API key, usa regex básico
- **Merge conservador**: No sobrescribe información existente
- **Tolerancia en matching**: 10% de flexibilidad en presupuesto
- **Límites de respuesta**: Máximo 3 propiedades por respuesta 