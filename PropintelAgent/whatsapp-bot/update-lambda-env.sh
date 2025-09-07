#!/bin/bash

# 🔧 Script para actualizar variables de entorno en Lambda
# Uso: ./update-lambda-env.sh

set -e

echo "🔧 Actualizando variables de entorno en Lambda..."

# Verificar que AWS CLI está configurado
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Error: AWS CLI no está configurado"
    echo "   Ejecuta: aws configure"
    exit 1
fi

# Leer variables del .env local
if [ ! -f ".env" ]; then
    echo "❌ Error: Archivo .env no encontrado"
    echo "   Crea un archivo .env con las variables necesarias"
    exit 1
fi

echo "📖 Leyendo configuración desde .env..."

# Extraer variables
OPENAI_API_KEY=$(grep "OPENAI_API_KEY=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
OPENAI_MODEL=$(grep "OPENAI_MODEL=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
ADMIN_API_KEY=$(grep "ADMIN_API_KEY=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")

# Valores por defecto
if [ -z "$OPENAI_MODEL" ]; then
    OPENAI_MODEL="gpt-4o-mini"
fi

# Verificar variables críticas
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY no encontrada en .env"
    exit 1
fi

if [ -z "$ADMIN_API_KEY" ]; then
    echo "❌ Error: ADMIN_API_KEY no encontrada en .env"
    exit 1
fi

echo "✅ Variables leídas:"
echo "   OPENAI_MODEL: $OPENAI_MODEL"
echo "   OPENAI_API_KEY: ${OPENAI_API_KEY:0:8}..."
echo "   ADMIN_API_KEY: ${ADMIN_API_KEY:0:8}..."

# Actualizar Lambda
echo "🚀 Actualizando variables de entorno en Lambda..."

aws lambda update-function-configuration \
    --function-name whatsapp-bot-api \
    --environment Variables="{
        \"OPENAI_API_KEY\":\"$OPENAI_API_KEY\",
        \"OPENAI_MODEL\":\"$OPENAI_MODEL\",
        \"ADMIN_API_KEY\":\"$ADMIN_API_KEY\",
        \"LEADS_TABLE\":\"Leads\",
        \"MESSAGES_TABLE\":\"Messages\",
        \"PROPERTIES_TABLE\":\"Properties\",
        \"VISITS_TABLE\":\"Visits\"
    }" > /dev/null

echo "✅ Variables de entorno actualizadas en Lambda"
echo ""
echo "🧪 Para verificar, puedes ejecutar:"
echo "   aws lambda get-function-configuration --function-name whatsapp-bot-api --query 'Environment.Variables'"