# Setup del Sistema de Debounce

## 1. Crear tabla DynamoDB

```bash
aws dynamodb create-table \
  --region us-east-2 \
  --table-name PendingMessages \
  --attribute-definitions \
    AttributeName=LeadId,AttributeType=S \
    AttributeName=Timestamp,AttributeType=S \
  --key-schema \
    AttributeName=LeadId,KeyType=HASH \
    AttributeName=Timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --time-to-live-specification \
    AttributeName=TTL,Enabled=true
```

## 2. Crear rol para EventBridge Scheduler

```bash
# Crear rol
aws iam create-role \
  --role-name EventBridgeSchedulerRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "scheduler.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Agregar política para invocar Lambda
aws iam put-role-policy \
  --role-name EventBridgeSchedulerRole \
  --policy-name InvokeLambdaPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "lambda:InvokeFunction"
        ],
        "Resource": "arn:aws:lambda:us-east-2:916652081830:function:whatsapp-bot-processor"
      }
    ]
  }'
```

## 3. Agregar permisos al rol del webhook

El rol del webhook necesita permisos para:
- DynamoDB: PutItem, Query, DeleteItem en tabla PendingMessages
- Scheduler: CreateSchedule, DeleteSchedule
- STS: GetCallerIdentity

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-2:916652081830:table/PendingMessages"
    },
    {
      "Effect": "Allow",
      "Action": [
        "scheduler:CreateSchedule",
        "scheduler:DeleteSchedule"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

## 4. Variables de entorno del webhook

Agregar estas variables al webhook Lambda:
- `PENDING_MESSAGES_TABLE` = `PendingMessages`

## 5. Probar el sistema

```bash
# Enviar mensajes con delay
DELAY=5 ./send-messages.sh 3

# Deberías ver en logs:
# - Webhook: "📝 Mensaje agregado al debounce"
# - Después de 180s (3 min): "🔄 Procesando mensajes pendientes"
# - Una sola respuesta combinada
```

## Cómo funciona

1. **Mensaje llega al webhook** → Se guarda en PendingMessages
2. **Se programa procesamiento** en 180 segundos (3 minutos) usando EventBridge Scheduler
3. **Si llegan más mensajes** → Se cancela el schedule anterior y se programa uno nuevo
4. **Después de 3 minutos sin mensajes** → Se procesan todos los mensajes acumulados
5. **Antes de responder** → Se verifica que no llegaron mensajes nuevos
6. **Se envía una sola respuesta** combinada al usuario