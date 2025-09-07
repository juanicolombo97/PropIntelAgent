#!/usr/bin/env bash
# Simple sender de mensajes via curl al webhook de WhatsApp
# Editá las variables URL, FROM y el array MESSAGES según necesites.
# Uso:
#   ./send-messages.sh            # envía todos los mensajes del array
#   ./send-messages.sh 2          # envía solo los 2 primeros
#   DELAY=5 ./send-messages.sh 3  # espera 5s entre envíos

set -euo pipefail

# =====================
# CONFIGURACIÓN EDITABLE
# =====================

# URL del webhook (Lambda URL)
URL="https://rmys43m4av7y4kptnnvacfsmu40olhvq.lambda-url.us-east-2.on.aws/webhook"

# Teléfono/ID del lead (formato Twilio, p.ej. +549...) o simple numérico
# Cambiar el número para cada prueba para evitar mezclar mensajes
FROM="1"

# Lista de mensajes a enviar (editá libremente)
MESSAGES=(
  # "Hola ",
  # "Como estas?",
  # "todo bien?",
    "queria visitar una propiedad que vi que publicaste",
)

# =====================
# PARÁMETROS/OPCIONES
# =====================

# Cantidad a enviar: por defecto "all". Si pasás un número, envía solo esa cantidad.
COUNT="${1:-all}"

# Delay opcional entre mensajes (segundos). Setealo con variable de entorno: DELAY=5 ./send-messages.sh
DELAY="${DELAY:-0}"

send_one() {
  local msg="$1"
  echo "→ Enviando: From=$FROM | Body='$msg'"
  curl -s -X POST "$URL" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "From=$FROM" \
    --data-urlencode "Body=$msg" | cat
  echo -e "\n"
}

# Determinar cuántos mensajes enviar
if [[ "$COUNT" == "all" ]]; then
  max=${#MESSAGES[@]}
else
  # si no es número válido, forzar 1
  if ! [[ "$COUNT" =~ ^[0-9]+$ ]]; then COUNT=1; fi
  max=$COUNT
fi

for (( i=0; i<max && i<${#MESSAGES[@]}; i++ )); do
  send_one "${MESSAGES[$i]}"
  # delay entre mensajes si corresponde
  if [[ "$DELAY" =~ ^[0-9]+$ ]] && [[ $DELAY -gt 0 ]] && [[ $i -lt $((max-1)) ]]; then
    sleep "$DELAY"
  fi
done

echo "Listo. Enviados $(( i<${#MESSAGES[@]} ? i : max )) mensajes."

