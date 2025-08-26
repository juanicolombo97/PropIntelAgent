# 🚀 Configuración AWS - Guía Paso a Paso

Esta guía te llevará paso a paso para configurar AWS Lambda y hacer que tu panel inmobiliario funcione en producción.

## 📋 Prerrequisitos

- [ ] Cuenta de AWS activa
- [ ] AWS CLI instalado en tu computadora
- [ ] Bot de WhatsApp con el código actualizado

## 🎯 Paso 1: Configurar AWS CLI

```bash
# Instalar AWS CLI (si no lo tienes)
# macOS:
brew install awscli

# Linux/Windows: https://aws.amazon.com/cli/

# Configurar credenciales
aws configure
# AWS Access Key ID: [tu-access-key]
# AWS Secret Access Key: [tu-secret-key] 
# Default region: us-east-1 (o tu región preferida)
# Default output format: json
```

## 🗃️ Paso 2: Crear Tablas DynamoDB

### 2.1 Tabla de Leads
```bash
aws dynamodb create-table \
    --table-name leads \
    --attribute-definitions \
        AttributeName=LeadId,AttributeType=S \
    --key-schema \
        AttributeName=LeadId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### 2.2 Tabla de Mensajes
```bash
aws dynamodb create-table \
    --table-name messages \
    --attribute-definitions \
        AttributeName=LeadId,AttributeType=S \
        AttributeName=Timestamp,AttributeType=S \
    --key-schema \
        AttributeName=LeadId,KeyType=HASH \
        AttributeName=Timestamp,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### 2.3 Tabla de Propiedades
```bash
aws dynamodb create-table \
    --table-name properties \
    --attribute-definitions \
        AttributeName=PropertyId,AttributeType=S \
        AttributeName=Neighborhood,AttributeType=S \
    --key-schema \
        AttributeName=PropertyId,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=GSI_Neighborhood,KeySchema=[{AttributeName=Neighborhood,KeyType=HASH}],Projection={ProjectionType=ALL} \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### 2.4 Tabla de Visitas
```bash
aws dynamodb create-table \
    --table-name visits \
    --attribute-definitions \
        AttributeName=LeadId,AttributeType=S \
        AttributeName=VisitAt,AttributeType=S \
    --key-schema \
        AttributeName=LeadId,KeyType=HASH \
        AttributeName=VisitAt,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

## 🔧 Paso 3: Preparar el Código para Lambda

### 3.1 Crear archivo requirements.txt para Lambda
```bash
cd PropintelAgent/whatsapp-bot

# Crear requirements específico para Lambda
cat > requirements-lambda.txt << EOF
fastapi==0.104.1
mangum==0.17.0
boto3==1.34.0
pydantic==2.5.0
python-multipart==0.0.6
EOF
```

### 3.2 Crear handler para Lambda
```python
# Crear archivo lambda_handler.py
cat > lambda_handler.py << 'EOF'
from mangum import Mangum
from app import app

# Handler para AWS Lambda
handler = Mangum(app, lifespan="off")
EOF
```

## 📦 Paso 4: Crear Paquete de Despliegue

### 4.1 Instalar dependencias localmente
```bash
# Crear directorio para el paquete
mkdir lambda-package
cd lambda-package

# Instalar dependencias
pip install -r ../requirements-lambda.txt -t .

# Copiar código de la aplicación
cp -r ../models .
cp -r ../routers .
cp -r ../services .
cp -r ../utils .
cp ../app.py .
cp ../lambda_handler.py .
cp ../config.py .

# Crear archivo ZIP
zip -r ../whatsapp-bot-lambda.zip .
cd ..
```

## ⚡ Paso 5: Crear Función Lambda

### 5.1 Crear rol IAM para Lambda
```bash
# Crear política de confianza
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Crear rol
aws iam create-role \
    --role-name WhatsAppBotLambdaRole \
    --assume-role-policy-document file://trust-policy.json

# Adjuntar políticas básicas
aws iam attach-role-policy \
    --role-name WhatsAppBotLambdaRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Adjuntar permisos de DynamoDB
aws iam attach-role-policy \
    --role-name WhatsAppBotLambdaRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
```

### 5.2 Crear función Lambda
```bash
# Obtener ARN del rol (guarda este valor)
aws iam get-role --role-name WhatsAppBotLambdaRole --query 'Role.Arn' --output text

# Crear función Lambda (reemplaza ROLE-ARN con el valor anterior)
aws lambda create-function \
    --function-name whatsapp-bot-api \
    --runtime python3.11 \
    --role ROLE-ARN \
    --handler lambda_handler.handler \
    --zip-file fileb://whatsapp-bot-lambda.zip \
    --timeout 30 \
    --memory-size 512 \
    --region us-east-1
```

## 🔐 Paso 6: Configurar Variables de Entorno en Lambda

```bash
# Generar credenciales seguras (ejecuta esto en tu local)
python3 -c "
import secrets
import string

def generate_password(length=16):
    chars = string.ascii_letters + string.digits + '!@#$%^&*'
    return ''.join(secrets.choice(chars) for _ in range(length))

def generate_api_key(length=32):
    return secrets.token_hex(length)

print('🔐 Credenciales generadas para AWS Lambda:')
print(f'ADMIN_PASSWORD={generate_password()}')
print(f'ADMIN_API_KEY={generate_api_key()}')
"

# Configurar variables de entorno (reemplaza con tus valores generados)
aws lambda update-function-configuration \
    --function-name whatsapp-bot-api \
    --environment Variables='{
        "ADMIN_USERNAME":"admin",
        "ADMIN_PASSWORD":"TU-PASSWORD-GENERADO",
        "ADMIN_EMAIL":"admin@tu-dominio.com",
        "ADMIN_API_KEY":"TU-API-KEY-GENERADO"
    }'
```

## 🌐 Paso 7: Crear API Gateway

### 7.1 Crear API REST
```bash
# Crear API
API_ID=$(aws apigateway create-rest-api \
    --name whatsapp-bot-api \
    --description "API para bot de WhatsApp" \
    --query 'id' --output text)

echo "API ID: $API_ID"

# Obtener resource root
ROOT_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[0].id' --output text)

echo "Root Resource ID: $ROOT_ID"
```

### 7.2 Configurar recursos y métodos
```bash
# Crear resource proxy para capturar todas las rutas
PROXY_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part '{proxy+}' \
    --query 'id' --output text)

# Crear método ANY para el proxy
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --authorization-type NONE

# Obtener ARN de la función Lambda
LAMBDA_ARN=$(aws lambda get-function \
    --function-name whatsapp-bot-api \
    --query 'Configuration.FunctionArn' --output text)

# Integrar con Lambda
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations

# Dar permisos a API Gateway para invocar Lambda
aws lambda add-permission \
    --function-name whatsapp-bot-api \
    --statement-id api-gateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:us-east-1:*:$API_ID/*/*"
```

### 7.3 Desplegar API
```bash
# Crear deployment
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod

# Tu URL será:
echo "🌐 URL de tu API: https://$API_ID.execute-api.us-east-1.amazonaws.com/prod"
```

## ✅ Paso 8: Probar la Configuración

### 8.1 Verificar que la API funciona
```bash
# Obtener la URL de tu API
API_URL="https://$API_ID.execute-api.us-east-1.amazonaws.com/prod"

# Probar endpoint de salud
curl $API_URL/

# Probar autenticación (usa tus credenciales)
curl -X POST $API_URL/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"TU-PASSWORD-GENERADO"}'
```

### 8.2 Verificar las tablas DynamoDB
```bash
# Listar tablas
aws dynamodb list-tables

# Verificar estructura de una tabla
aws dynamodb describe-table --table-name leads
```

## 🔗 Paso 9: Configurar el Frontend

Ahora que tienes tu API funcionando en AWS, actualiza tu frontend:

### 9.1 Configurar variables de entorno del panel
```bash
cd PropintelAgent/inmobiliaria-panel

# Ejecutar configurador
npm run configure-production

# Cuando te pregunte por la URL del backend, usa:
# https://TU-API-ID.execute-api.us-east-1.amazonaws.com/prod

# Usa las mismas credenciales que configuraste en Lambda
```

## 🚀 Paso 10: Desplegar el Frontend en Vercel

```bash
# Subir a GitHub (si no lo has hecho)
git add .
git commit -m "Configuración completa para AWS Lambda"
git push origin main

# Ir a vercel.com y conectar tu repositorio
# Configurar las variables de entorno desde .env.production
```

## 🔍 Paso 11: Verificación Final

### 11.1 URLs importantes
- **API Backend**: `https://TU-API-ID.execute-api.us-east-1.amazonaws.com/prod`
- **Panel Frontend**: `https://tu-app.vercel.app`

### 11.2 Probar flujo completo
1. Ir a tu panel frontend
2. Hacer login con tus credenciales
3. Verificar que los datos se cargan desde AWS
4. Crear un lead de prueba
5. Verificar en DynamoDB que se guardó

## 🆘 Solución de Problemas

### Si la API no responde:
```bash
# Ver logs de Lambda
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/whatsapp-bot-api

# Ver logs específicos
aws logs filter-log-events --log-group-name /aws/lambda/whatsapp-bot-api
```

### Si hay errores de permisos:
```bash
# Verificar rol IAM
aws iam get-role --role-name WhatsAppBotLambdaRole

# Verificar políticas adjuntas
aws iam list-attached-role-policies --role-name WhatsAppBotLambdaRole
```

### Si no se pueden leer las tablas:
```bash
# Verificar que las tablas existen
aws dynamodb list-tables

# Probar acceso a una tabla
aws dynamodb scan --table-name leads --limit 1
```

## 📞 Resumen

Al completar esta guía tendrás:

✅ **DynamoDB**: 4 tablas configuradas
✅ **Lambda**: Función con tu bot desplegada  
✅ **API Gateway**: API pública accesible
✅ **Frontend**: Panel conectado a AWS
✅ **Seguridad**: Credenciales únicas y seguras

**Tu API estará disponible en:**
`https://TU-API-ID.execute-api.us-east-1.amazonaws.com/prod`

**Tu panel estará disponible en:**
`https://tu-app.vercel.app`

¡Y todo funcionará en producción! 🎉