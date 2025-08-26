# 🚀 Configuración AWS Lambda - Panel Inmobiliario

Esta guía te ayudará a configurar el panel inmobiliario para trabajar con AWS Lambda en lugar de un servidor local.

## 📋 Prerrequisitos

- [ ] Cuenta de AWS activa
- [ ] AWS CLI configurado
- [ ] Bot de WhatsApp desplegado en AWS Lambda
- [ ] DynamoDB configurado con las tablas necesarias

## 🔧 Configuración del Backend (Lambda)

### 1. Variables de Entorno en Lambda

Configura las siguientes variables de entorno en tu función Lambda:

```bash
# === AUTENTICACIÓN ===
ADMIN_USERNAME=tu-usuario-admin
ADMIN_PASSWORD=tu-contraseña-segura
ADMIN_EMAIL=admin@tu-dominio.com
ADMIN_API_KEY=tu-api-key-super-secreta

# === USUARIOS ADICIONALES (Opcional) ===
USER_JUAN_PASSWORD=password-seguro-juan
USER_JUAN_EMAIL=juan@tu-dominio.com
USER_JUAN_ROLE=user

USER_MARIA_PASSWORD=password-seguro-maria  
USER_MARIA_EMAIL=maria@tu-dominio.com
USER_MARIA_ROLE=admin

# === CONFIGURACIÓN DYNAMO ===
AWS_REGION=us-east-1
# Las credenciales de AWS se gestionan automáticamente en Lambda

# === TWILIO (Si usas WhatsApp) ===
TWILIO_ACCOUNT_SID=tu-account-sid
TWILIO_AUTH_TOKEN=tu-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 2. Permisos IAM para Lambda

Tu función Lambda necesita los siguientes permisos:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            "Resource": [
                "arn:aws:dynamodb:*:*:table/PropIntel_Leads",
                "arn:aws:dynamodb:*:*:table/PropIntel_Messages", 
                "arn:aws:dynamodb:*:*:table/PropIntel_Properties",
                "arn:aws:dynamodb:*:*:table/PropIntel_Visits",
                "arn:aws:dynamodb:*:*:table/PropIntel_*"
            ]
        },
        {
            "Effect": "Allow", 
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        }
    ]
}
```

## 🌐 Configuración del Frontend (Next.js)

### 1. Variables de Entorno Locales

Crea un archivo `.env.local` con:

```bash
# Secreto para JWT (genera uno único)
JWT_SECRET=tu-secreto-jwt-super-seguro-64-caracteres-minimo

# === AUTENTICACIÓN ===
ADMIN_USERNAME=tu-usuario-admin
ADMIN_PASSWORD=tu-contraseña-segura  
ADMIN_EMAIL=admin@tu-dominio.com

# === CONFIGURACIÓN DE API ===
# URL de tu función Lambda
WHATSAPP_API_URL=https://tu-lambda-id.execute-api.us-east-1.amazonaws.com/prod

# API Key (debe coincidir con Lambda)
ADMIN_API_KEY=tu-api-key-super-secreta

# === PRODUCCIÓN ===
NODE_ENV=production
```

### 2. Generar Secretos Seguros

```bash
# Generar secretos automáticamente
npm run generate-secrets

# O usar el configurador automático
npm run setup
```

## 🚀 Despliegue en Vercel

### 1. Configurar Variables de Entorno en Vercel

En el dashboard de Vercel, ve a Settings > Environment Variables y agrega:

| Variable | Valor | Entorno |
|----------|-------|---------|
| `JWT_SECRET` | `tu-secreto-generado` | Production, Preview, Development |
| `ADMIN_USERNAME` | `tu-usuario` | Production, Preview |
| `ADMIN_PASSWORD` | `tu-contraseña` | Production, Preview | 
| `ADMIN_EMAIL` | `admin@tu-dominio.com` | Production, Preview |
| `WHATSAPP_API_URL` | `https://tu-lambda-url` | Production, Preview, Development |
| `ADMIN_API_KEY` | `tu-api-key` | Production, Preview |
| `NODE_ENV` | `production` | Production |

### 2. Desplegar

```bash
# Conectar con GitHub y desplegar automáticamente
vercel --prod

# O configurar desde el dashboard de Vercel
```

## 🔒 Configuración de Usuarios Múltiples

### En Lambda (Variables de Entorno):

```bash
# Usuario Admin Principal
ADMIN_USERNAME=admin
ADMIN_PASSWORD=contraseña-super-segura
ADMIN_EMAIL=admin@propintel.com

# Usuario de Ventas
USER_VENDEDOR_PASSWORD=password-vendedor-123
USER_VENDEDOR_EMAIL=vendedor@propintel.com
USER_VENDEDOR_ROLE=user

# Usuario Supervisor
USER_SUPERVISOR_PASSWORD=password-super-123
USER_SUPERVISOR_EMAIL=supervisor@propintel.com  
USER_SUPERVISOR_ROLE=admin
```

### En Vercel (Mismo formato que arriba)

## 🧪 Probar la Configuración

### 1. Verificar Conectividad

```bash
# Probar endpoint de salud
curl https://tu-lambda-url.execute-api.us-east-1.amazonaws.com/prod/

# Probar autenticación
curl -X POST https://tu-lambda-url/admin/auth/login \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tu-api-key" \
  -d '{"username":"admin","password":"tu-contraseña"}'
```

### 2. Verificar Panel Web

1. Ve a tu URL de Vercel: `https://tu-app.vercel.app`
2. Deberías ver la página de login
3. Ingresa tus credenciales configuradas
4. Verifica que puedas acceder al dashboard

## 🛠️ Solución de Problemas

### Error: "API_KEY no configurada"

- ✅ Verifica que `ADMIN_API_KEY` esté configurada en Lambda
- ✅ Verifica que `ADMIN_API_KEY` esté configurada en Vercel
- ✅ Ambos valores deben ser idénticos

### Error: "Credenciales inválidas"

- ✅ Verifica las variables `ADMIN_USERNAME` y `ADMIN_PASSWORD` en Lambda
- ✅ Asegúrate de usar las mismas credenciales en el login

### Error: "Error en API 500"

- ✅ Revisa los logs de CloudWatch de tu función Lambda
- ✅ Verifica que Lambda tenga permisos de DynamoDB
- ✅ Confirma que las tablas de DynamoDB existen

### Error: "CORS"

Agrega este handler en tu Lambda:

```python
# En app.py o el archivo principal
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tu-app.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📞 URLs de Ejemplo

### Lambda en AWS:
```
https://abc123def456.execute-api.us-east-1.amazonaws.com/prod
```

### Vercel Frontend:
```
https://propintel-panel.vercel.app
```

## 🔐 Mejores Prácticas de Seguridad

1. **Credenciales Únicas**: Nunca uses credenciales por defecto en producción
2. **JWT Secret**: Usa un secreto de al menos 64 caracteres
3. **API Keys**: Genera API keys únicos y complejos
4. **HTTPS**: Siempre usa HTTPS en producción
5. **Variables de Entorno**: Nunca hardcodees credenciales en el código
6. **Rotación**: Cambia credenciales periódicamente
7. **Logs**: No logguees credenciales o tokens
8. **Timeout**: Configura timeouts apropiados para las APIs

¡Con esta configuración tendrás un panel completamente funcional y seguro conectado a AWS Lambda! 🎉