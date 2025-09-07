#!/usr/bin/env bash
# Script para probar conversación completa con el bot
# Simula una conversación real paso a paso

set -euo pipefail

# URL del webhook
URL="https://rmys43m4av7y4kptnnvacfsmu40olhvq.lambda-url.us-east-2.on.aws/webhook"

# Lead único para esta prueba
FROM="+549$(date +%s)"

echo "🧪 Iniciando prueba de conversación con lead: $FROM"
echo ""

# Función para enviar mensaje y mostrar respuesta
send_and_show() {
    local message="$1"
    echo "👤 Usuario: $message"
    
    response=$(curl -s -X POST "$URL" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        --data-urlencode "From=$FROM" \
        --data-urlencode "Body=$message")
    
    # Extraer solo el mensaje del bot (entre <Message> y </Message>)
    bot_message=$(echo "$response" | sed -n 's/.*<Message>\(.*\)<\/Message>.*/\1/p')
    
    if [ -n "$bot_message" ]; then
        echo "🤖 Bot: $bot_message"
    else
        echo "🤖 Bot: [Sin respuesta o respuesta vacía]"
    fi
    echo ""
    
    # Esperar un poco entre mensajes
    sleep 2
}

echo "=== PRUEBA 1: Saludo inicial ==="
send_and_show "Hola"

echo "=== PRUEBA 2: Segunda interacción (NO debe presentarse de nuevo) ==="
send_and_show "Como estas?"

echo "=== PRUEBA 3: Tercera interacción (debe continuar naturalmente) ==="
send_and_show "todo bien?"

echo "=== PRUEBA 4: Pregunta específica (debe responder directamente) ==="
send_and_show "Que propiedades tienen?"

echo "✅ Prueba completada."
echo "⏰ El sistema esperará 3 minutos antes de procesar los mensajes combinados."
echo "📊 Revisa los logs del Processor para ver el debounce en acción."