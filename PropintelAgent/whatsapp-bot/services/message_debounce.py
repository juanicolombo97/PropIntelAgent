# services/message_debounce.py
"""
Sistema de debounce confiable para mensajes de WhatsApp.
Garantiza que se espere 1 minuto sin nuevos mensajes antes de procesar.
"""

import json
import time
import boto3
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional

# Clientes AWS
dynamodb = boto3.resource('dynamodb')
scheduler = boto3.client('scheduler')

# Tabla para almacenar mensajes pendientes
PENDING_MESSAGES_TABLE = "PendingMessages"
t_pending = dynamodb.Table(PENDING_MESSAGES_TABLE)

# Configuración
DEBOUNCE_SECONDS = 180  # 3 minutos
WEBHOOK_URL = "https://rmys43m4av7y4kptnnvacfsmu40olhvq.lambda-url.us-east-2.on.aws/webhook"

def add_message_to_debounce(lead_id: str, message: str) -> bool:
    """
    Agrega un mensaje al sistema de debounce.
    Cancela cualquier procesamiento pendiente y programa uno nuevo.
    """
    try:
        current_time = datetime.now(timezone.utc)
        process_time = current_time + timedelta(seconds=DEBOUNCE_SECONDS)
        
        # 1. Cancelar scheduler existente si existe
        cancel_existing_scheduler(lead_id)
        
        # 2. Agregar mensaje a la tabla de pendientes
        t_pending.put_item(
            Item={
                'LeadId': lead_id,
                'Message': message,
                'Timestamp': current_time.isoformat(),
                'ProcessAt': process_time.isoformat(),
                'TTL': int(process_time.timestamp()) + 300  # TTL 5 min después del procesamiento
            }
        )
        
        # 3. Programar nuevo procesamiento
        schedule_processing(lead_id, process_time)
        
        print(f"📝 Mensaje agregado al debounce: {lead_id} -> '{message}' (procesar en {DEBOUNCE_SECONDS}s)")
        return True
        
    except Exception as e:
        print(f"❌ Error en add_message_to_debounce: {e}")
        return False

def cancel_existing_scheduler(lead_id: str):
    """
    Cancela el scheduler existente para un lead.
    """
    try:
        schedule_name = f"process-lead-{lead_id.replace('+', 'plus').replace(' ', '')}"
        
        # Intentar eliminar el schedule existente
        scheduler.delete_schedule(Name=schedule_name)
        print(f"🗑️ Scheduler cancelado: {schedule_name}")
        
    except scheduler.exceptions.ResourceNotFoundException:
        # No existe, está bien
        pass
    except Exception as e:
        print(f"⚠️ Error cancelando scheduler: {e}")

def schedule_processing(lead_id: str, process_time: datetime):
    """
    Programa el procesamiento de mensajes usando EventBridge Scheduler.
    """
    try:
        schedule_name = f"process-lead-{lead_id.replace('+', 'plus').replace(' ', '')}"
        
        # Payload para el procesador
        payload = {
            'action': 'process_debounced_messages',
            'lead_id': lead_id,
            'scheduled_time': process_time.isoformat()
        }
        
        # Crear schedule one-time
        scheduler.create_schedule(
            Name=schedule_name,
            ScheduleExpression=f"at({process_time.strftime('%Y-%m-%dT%H:%M:%S')})",
            Target={
                'Arn': f"arn:aws:lambda:us-east-2:{get_account_id()}:function:whatsapp-bot-processor",
                'RoleArn': f"arn:aws:iam::{get_account_id()}:role/EventBridgeSchedulerRole",
                'Input': json.dumps(payload)
            },
            FlexibleTimeWindow={'Mode': 'OFF'},
            Description=f"Process debounced messages for lead {lead_id}"
        )
        
        print(f"⏰ Procesamiento programado: {schedule_name} a las {process_time}")
        
    except Exception as e:
        print(f"❌ Error programando procesamiento: {e}")

def get_pending_messages(lead_id: str) -> List[Dict[str, Any]]:
    """
    Obtiene todos los mensajes pendientes para un lead.
    """
    try:
        response = t_pending.query(
            KeyConditionExpression="LeadId = :lead_id",
            ExpressionAttributeValues={":lead_id": lead_id},
            ScanIndexForward=True  # Ordenar por timestamp
        )
        
        return response.get('Items', [])
        
    except Exception as e:
        print(f"❌ Error obteniendo mensajes pendientes: {e}")
        return []

def process_debounced_messages(lead_id: str, scheduled_time: str) -> bool:
    """
    Procesa los mensajes pendientes para un lead.
    Verifica que no hayan llegado mensajes nuevos antes de procesar.
    """
    try:
        print(f"🔄 Procesando mensajes pendientes para {lead_id}")
        
        # 1. Obtener todos los mensajes pendientes
        pending_messages = get_pending_messages(lead_id)
        
        if not pending_messages:
            print(f"ℹ️ No hay mensajes pendientes para {lead_id}")
            return True
        
        # 2. Verificar que el último mensaje sea anterior al tiempo programado
        scheduled_dt = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
        latest_message_time = None
        
        for msg in pending_messages:
            msg_time = datetime.fromisoformat(msg['Timestamp'].replace('Z', '+00:00'))
            if not latest_message_time or msg_time > latest_message_time:
                latest_message_time = msg_time
        
        # 3. Si llegó un mensaje después del tiempo programado, reprogramar
        if latest_message_time and latest_message_time > scheduled_dt:
            print(f"🔄 Mensaje más reciente detectado, reprogramando...")
            new_process_time = latest_message_time + timedelta(seconds=DEBOUNCE_SECONDS)
            schedule_processing(lead_id, new_process_time)
            return True
        
        # 4. Combinar mensajes y procesar
        messages = [msg['Message'] for msg in pending_messages]
        combined_message = ". ".join(messages) if len(messages) > 1 else messages[0]
        
        print(f"💬 Procesando mensaje combinado: '{combined_message}'")
        
        # 5. Llamar al webhook
        success = call_webhook_direct(lead_id, combined_message)
        
        # 6. Limpiar mensajes pendientes si fue exitoso
        if success:
            clear_pending_messages(lead_id)
            print(f"✅ Mensajes procesados y limpiados para {lead_id}")
        
        return success
        
    except Exception as e:
        print(f"❌ Error procesando mensajes pendientes: {e}")
        return False

def clear_pending_messages(lead_id: str):
    """
    Limpia todos los mensajes pendientes para un lead.
    """
    try:
        pending_messages = get_pending_messages(lead_id)
        
        for msg in pending_messages:
            t_pending.delete_item(
                Key={
                    'LeadId': lead_id,
                    'Timestamp': msg['Timestamp']
                }
            )
        
        print(f"🗑️ {len(pending_messages)} mensajes pendientes limpiados para {lead_id}")
        
    except Exception as e:
        print(f"❌ Error limpiando mensajes pendientes: {e}")

def call_webhook_direct(lead_id: str, message: str) -> bool:
    """
    Llama directamente al webhook con el mensaje combinado.
    """
    try:
        import requests
        
        response = requests.post(
            WEBHOOK_URL,
            data={
                'From': lead_id,
                'Body': message
            },
            headers={
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-From-Debounce': 'true'  # Identificar que viene del debounce
            },
            timeout=30
        )
        
        if response.status_code == 200:
            print(f"✅ Webhook exitoso para {lead_id}")
            return True
        else:
            print(f"❌ Webhook falló: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error llamando webhook: {e}")
        return False

def get_account_id() -> str:
    """
    Obtiene el Account ID de AWS.
    """
    try:
        sts = boto3.client('sts')
        return sts.get_caller_identity()['Account']
    except Exception:
        return "916652081830"  # Fallback a tu account ID