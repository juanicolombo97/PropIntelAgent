#!/bin/bash

# 🚀 Script de Configuración Automática AWS
# Este script configura DynamoDB, Lambda y API Gateway automáticamente

set -e  # Salir si hay algún error

echo "🚀 Configuración Automática AWS - Panel Inmobiliario"
echo "=================================================="

# Verificar que AWS CLI está configurado
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Error: AWS CLI no está configurado"
    echo "   Ejecuta: aws configure"
    exit 1
fi

# Obtener región y cuenta
AWS_REGION=$(aws configure get region || echo "us-east-1")
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "📍 Región: $AWS_REGION"
echo "🆔 Cuenta: $AWS_ACCOUNT_ID"
echo ""

# Función para generar credenciales
generate_credentials() {
    echo "🔐 Generando credenciales seguras..."
    
    # Generar contraseña
    ADMIN_PASSWORD=$(openssl rand -base64 12 | tr -d "=+/" | cut -c1-16)
    
    # Generar API Key
    ADMIN_API_KEY=$(openssl rand -hex 32)
    
    echo "ADMIN_PASSWORD: $ADMIN_PASSWORD"
    echo "ADMIN_API_KEY: $ADMIN_API_KEY"
    echo ""
}

# Función para crear tablas DynamoDB
create_dynamodb_tables() {
    echo "📊 Creando tablas DynamoDB..."
    
    # Tabla leads
    if ! aws dynamodb describe-table --table-name leads &> /dev/null; then
        echo "  → Creando tabla 'leads'..."
        aws dynamodb create-table \
            --table-name leads \
            --attribute-definitions \
                AttributeName=LeadId,AttributeType=S \
            --key-schema \
                AttributeName=LeadId,KeyType=HASH \
            --billing-mode PAY_PER_REQUEST \
            --region $AWS_REGION > /dev/null
    else
        echo "  ✓ Tabla 'leads' ya existe"
    fi
    
    # Tabla messages
    if ! aws dynamodb describe-table --table-name messages &> /dev/null; then
        echo "  → Creando tabla 'messages'..."
        aws dynamodb create-table \
            --table-name messages \
            --attribute-definitions \
                AttributeName=LeadId,AttributeType=S \
                AttributeName=Timestamp,AttributeType=S \
            --key-schema \
                AttributeName=LeadId,KeyType=HASH \
                AttributeName=Timestamp,KeyType=RANGE \
            --billing-mode PAY_PER_REQUEST \
            --region $AWS_REGION > /dev/null
    else
        echo "  ✓ Tabla 'messages' ya existe"
    fi
    
    # Tabla properties
    if ! aws dynamodb describe-table --table-name properties &> /dev/null; then
        echo "  → Creando tabla 'properties'..."
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
            --region $AWS_REGION > /dev/null
    else
        echo "  ✓ Tabla 'properties' ya existe"
    fi
    
    # Tabla visits
    if ! aws dynamodb describe-table --table-name visits &> /dev/null; then
        echo "  → Creando tabla 'visits'..."
        aws dynamodb create-table \
            --table-name visits \
            --attribute-definitions \
                AttributeName=LeadId,AttributeType=S \
                AttributeName=VisitAt,AttributeType=S \
            --key-schema \
                AttributeName=LeadId,KeyType=HASH \
                AttributeName=VisitAt,KeyType=RANGE \
            --billing-mode PAY_PER_REQUEST \
            --region $AWS_REGION > /dev/null
    else
        echo "  ✓ Tabla 'visits' ya existe"
    fi
    
    echo "  ✅ Tablas DynamoDB configuradas"
    echo ""
}

# Función para crear rol IAM
create_iam_role() {
    echo "🔐 Configurando rol IAM..."
    
    # Crear política de confianza
    cat > /tmp/trust-policy.json << EOF
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
    
    # Crear rol si no existe
    if ! aws iam get-role --role-name WhatsAppBotLambdaRole &> /dev/null; then
        echo "  → Creando rol IAM..."
        aws iam create-role \
            --role-name WhatsAppBotLambdaRole \
            --assume-role-policy-document file:///tmp/trust-policy.json > /dev/null
        
        # Adjuntar políticas
        aws iam attach-role-policy \
            --role-name WhatsAppBotLambdaRole \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        aws iam attach-role-policy \
            --role-name WhatsAppBotLambdaRole \
            --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
        
        # Esperar a que el rol se propague
        echo "  → Esperando propagación del rol..."
        sleep 10
    else
        echo "  ✓ Rol IAM ya existe"
    fi
    
    # Obtener ARN del rol
    ROLE_ARN=$(aws iam get-role --role-name WhatsAppBotLambdaRole --query 'Role.Arn' --output text)
    echo "  ✅ Rol IAM configurado: $ROLE_ARN"
    echo ""
}

# Función para crear paquete Lambda
create_lambda_package() {
    echo "📦 Creando paquete Lambda..."
    
    cd ../whatsapp-bot
    
    # Crear requirements para Lambda
    cat > requirements-lambda.txt << EOF
fastapi==0.104.1
mangum==0.17.0
boto3==1.34.0
pydantic==2.5.0
python-multipart==0.0.6
EOF
    
    # Crear handler para Lambda
    cat > lambda_handler.py << 'EOF'
from mangum import Mangum
from app import app

# Handler para AWS Lambda
handler = Mangum(app, lifespan="off")
EOF
    
    # Crear directorio temporal
    rm -rf lambda-package
    mkdir lambda-package
    cd lambda-package
    
    # Instalar dependencias
    echo "  → Instalando dependencias..."
    pip install -r ../requirements-lambda.txt -t . > /dev/null 2>&1
    
    # Copiar código de la aplicación
    cp -r ../models .
    cp -r ../routers .
    cp -r ../services .
    cp -r ../utils .
    cp ../app.py .
    cp ../lambda_handler.py .
    cp ../config.py .
    
    # Crear archivo ZIP
    echo "  → Creando paquete ZIP..."
    zip -r ../whatsapp-bot-lambda.zip . > /dev/null
    
    cd ..
    rm -rf lambda-package
    
    echo "  ✅ Paquete Lambda creado"
    echo ""
}

# Función para crear función Lambda
create_lambda_function() {
    echo "⚡ Configurando función Lambda..."
    
    # Crear función si no existe
    if ! aws lambda get-function --function-name whatsapp-bot-api &> /dev/null; then
        echo "  → Creando función Lambda..."
        aws lambda create-function \
            --function-name whatsapp-bot-api \
            --runtime python3.11 \
            --role $ROLE_ARN \
            --handler lambda_handler.handler \
            --zip-file fileb://whatsapp-bot-lambda.zip \
            --timeout 30 \
            --memory-size 512 \
            --region $AWS_REGION > /dev/null
    else
        echo "  → Actualizando función Lambda..."
        aws lambda update-function-code \
            --function-name whatsapp-bot-api \
            --zip-file fileb://whatsapp-bot-lambda.zip > /dev/null
    fi
    
    # Configurar variables de entorno
    echo "  → Configurando variables de entorno..."
    aws lambda update-function-configuration \
        --function-name whatsapp-bot-api \
        --environment Variables="{
            \"ADMIN_USERNAME\":\"admin\",
            \"ADMIN_PASSWORD\":\"$ADMIN_PASSWORD\",
            \"ADMIN_EMAIL\":\"admin@propintel.com\",
            \"ADMIN_API_KEY\":\"$ADMIN_API_KEY\"
        }" > /dev/null
    
    echo "  ✅ Función Lambda configurada"
    echo ""
}

# Función para crear API Gateway
create_api_gateway() {
    echo "🌐 Configurando API Gateway..."
    
    # Verificar si ya existe
    API_ID=$(aws apigateway get-rest-apis --query "items[?name=='whatsapp-bot-api'].id" --output text)
    
    if [ -z "$API_ID" ] || [ "$API_ID" == "None" ]; then
        echo "  → Creando API REST..."
        API_ID=$(aws apigateway create-rest-api \
            --name whatsapp-bot-api \
            --description "API para bot de WhatsApp" \
            --query 'id' --output text)
    else
        echo "  ✓ API ya existe: $API_ID"
    fi
    
    # Obtener resource root
    ROOT_ID=$(aws apigateway get-resources \
        --rest-api-id $API_ID \
        --query 'items[0].id' --output text)
    
    # Verificar si el proxy resource ya existe
    PROXY_RESOURCE_ID=$(aws apigateway get-resources \
        --rest-api-id $API_ID \
        --query "items[?pathPart=='{proxy+}'].id" --output text)
    
    if [ -z "$PROXY_RESOURCE_ID" ] || [ "$PROXY_RESOURCE_ID" == "None" ]; then
        echo "  → Configurando recursos..."
        
        # Crear resource proxy
        PROXY_RESOURCE_ID=$(aws apigateway create-resource \
            --rest-api-id $API_ID \
            --parent-id $ROOT_ID \
            --path-part '{proxy+}' \
            --query 'id' --output text)
        
        # Crear método ANY
        aws apigateway put-method \
            --rest-api-id $API_ID \
            --resource-id $PROXY_RESOURCE_ID \
            --http-method ANY \
            --authorization-type NONE > /dev/null
        
        # Obtener ARN de Lambda
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
            --uri arn:aws:apigateway:$AWS_REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations > /dev/null
        
        # Dar permisos a API Gateway
        aws lambda add-permission \
            --function-name whatsapp-bot-api \
            --statement-id api-gateway-invoke-$(date +%s) \
            --action lambda:InvokeFunction \
            --principal apigateway.amazonaws.com \
            --source-arn "arn:aws:execute-api:$AWS_REGION:$AWS_ACCOUNT_ID:$API_ID/*/*" > /dev/null 2>&1 || true
    fi
    
    # Desplegar API
    echo "  → Desplegando API..."
    aws apigateway create-deployment \
        --rest-api-id $API_ID \
        --stage-name prod > /dev/null
    
    API_URL="https://$API_ID.execute-api.$AWS_REGION.amazonaws.com/prod"
    echo "  ✅ API Gateway configurado: $API_URL"
    echo ""
}

# Función para probar la configuración
test_configuration() {
    echo "🧪 Probando configuración..."
    
    # Probar endpoint de salud
    echo "  → Probando endpoint de salud..."
    if curl -s -f "$API_URL/" > /dev/null; then
        echo "  ✅ API respondiendo correctamente"
    else
        echo "  ⚠️  API no responde (puede tomar unos minutos en activarse)"
    fi
    
    # Probar autenticación
    echo "  → Probando autenticación..."
    AUTH_RESPONSE=$(curl -s -X POST "$API_URL/admin/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"admin\",\"password\":\"$ADMIN_PASSWORD\"}" | jq -r '.success' 2>/dev/null || echo "false")
    
    if [ "$AUTH_RESPONSE" == "true" ]; then
        echo "  ✅ Autenticación funcionando"
    else
        echo "  ⚠️  Autenticación pendiente (la API puede tardar en activarse)"
    fi
    
    echo ""
}

# Función principal
main() {
    echo "Iniciando configuración AWS..."
    echo ""
    
    # Verificar directorio
    if [ ! -f "../whatsapp-bot/app.py" ]; then
        echo "❌ Error: No se encontró el código del bot"
        echo "   Ejecuta este script desde: PropintelAgent/inmobiliaria-panel/scripts/"
        exit 1
    fi
    
    # Ejecutar pasos
    generate_credentials
    create_dynamodb_tables
    create_iam_role
    create_lambda_package
    create_lambda_function
    create_api_gateway
    test_configuration
    
    # Guardar configuración
    cat > ../aws-config.env << EOF
# Configuración AWS generada automáticamente
AWS_REGION=$AWS_REGION
AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID
API_ID=$API_ID
API_URL=$API_URL
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_API_KEY=$ADMIN_API_KEY
EOF
    
    echo "🎉 ¡Configuración AWS Completada!"
    echo "================================="
    echo ""
    echo "📍 URL de tu API: $API_URL"
    echo "🔐 Usuario: admin"
    echo "🔑 Contraseña: $ADMIN_PASSWORD"
    echo "🗝️  API Key: $ADMIN_API_KEY"
    echo ""
    echo "📄 Configuración guardada en: aws-config.env"
    echo ""
    echo "🔄 Próximos pasos:"
    echo "1. Configurar el frontend: npm run configure-production"
    echo "2. Usar la URL de API cuando te la pida: $API_URL"
    echo "3. Usar las mismas credenciales en el frontend"
    echo "4. Desplegar en Vercel"
    echo ""
    echo "📚 Ver guía completa: AWS_SETUP_STEP_BY_STEP.md"
}

# Ejecutar script principal
main