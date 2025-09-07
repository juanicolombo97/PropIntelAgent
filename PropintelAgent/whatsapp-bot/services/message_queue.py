# services/message_queue.py
"""
Sistema de cola de mensajes para evitar respuestas duplicadas.
Usa SQS para acumular mensajes y procesarlos en batch después de un delay.
"""

import boto3
import json
import time
import os
from datetime import datetime, timezone
from typing import Dict, Any, List

# Cliente SQS
AWS_REGION = os.getenv("AWS_REGION", "us-east-2")
sqs = boto3.client('sqs', region_name=AWS_REGION)

# URLs de las colas (desde variables de entorno)
QUEUE_URL = os.getenv('MESSAGE_QUEUE_URL')
DLQ_URL = os.getenv('MESSAGE_DLQ_URL')

def send_message_to_queue(lead_id: str, message: str, delay_seconds: int = 30) -> bool:
    """
    Envía un mensaje a la cola SQS con delay.
    """
    try:
        if not QUEUE_URL:
            print("⚠️ MESSAGE_QUEUE_URL no configurada, procesando directamente")
            return False
        
        message_body = {
            "lead_id": lead_id,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "delay_seconds": delay_seconds
        }
        
        # Detectar si es cola FIFO o estándar
        is_fifo_queue = QUEUE_URL.endswith('.fifo')
        
        if is_fifo_queue:
            # Cola FIFO - usar parámetros específicos (sin DelaySeconds)
            clean_lead_id = lead_id.strip().replace(" ", "_").replace("+", "plus")
            response = sqs.send_message(
                QueueUrl=QUEUE_URL,
                MessageBody=json.dumps(message_body),
                MessageGroupId=clean_lead_id,
                MessageDeduplicationId=f"{clean_lead_id}_{int(time.time() * 1000)}"
            )
        else:
            # Cola estándar - solo parámetros básicos
            response = sqs.send_message(
                QueueUrl=QUEUE_URL,
                MessageBody=json.dumps(message_body),
                DelaySeconds=delay_seconds
            )
        
        print(f"📤 Mensaje enviado a SQS: {lead_id} (delay: {delay_seconds}s)")
        return True
        
    except Exception as e:
        print(f"❌ Error enviando mensaje a SQS: {e}")
        return False

def combine_messages(messages: List[str]) -> str:
    """
    Combina múltiples mensajes en uno solo de forma inteligente.
    """
    if not messages:
        return ""
    
    if len(messages) == 1:
        return messages[0]
    
    # Filtrar mensajes muy cortos o repetitivos
    filtered_messages = []
    for msg in messages:
        msg_clean = msg.strip().lower()
        
        if len(msg_clean) < 3:
            continue
        
        # Evitar duplicados consecutivos
        if msg_clean in ["si", "no", "ok", "dale", "hola"]:
            if not filtered_messages or filtered_messages[-1].lower() != msg_clean:
                filtered_messages.append(msg.strip())
        else:
            filtered_messages.append(msg.strip())
    
    if not filtered_messages:
        return messages[-1]
    
    # Combinar de forma natural
    if len(filtered_messages) <= 3:
        return ". ".join(filtered_messages)
    else:
        return ". ".join([filtered_messages[0], filtered_messages[-1]])

def check_recent_messages(lead_id: str, window_seconds: int = 120) -> List[str]:
    """
    Verifica mensajes recientes del lead en DynamoDB.
    """
    try:
        from services.dynamo import query_messages
        
        messages = query_messages(lead_id, limit=10)
        current_time = int(time.time())
        
        recent_messages = []
        for msg in messages:
            msg_time = int(msg.get('Timestamp', '0'))
            if current_time - msg_time < window_seconds:
                if msg.get('Direction') == 'in':  # Solo del usuario
                    recent_messages.append(msg.get('Text', ''))
        
        return recent_messages
        
    except Exception as e:
        print(f"❌ Error verificando mensajes recientes: {e}")
        return []