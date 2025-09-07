# lambda_processor.py
"""
Lambda Procesador - Agrupa mensajes del mismo lead y los envía al webhook principal.
"""

import json
import sys
import os
import boto3
import time
import requests
from datetime import datetime, timezone
from collections import defaultdict

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def lambda_handler(event, context):
    """
    Handler del Lambda Procesador - Maneja tanto SQS como eventos de debounce.
    """
    try:
        print(f"🔄 Lambda Procesador iniciado")
        
        # Detectar tipo de evento
        if 'action' in event and event['action'] == 'process_debounced_messages':
            # Evento de debounce desde EventBridge Scheduler
            return handle_debounce_event(event, context)
        else:
            # Evento tradicional de SQS (mantener compatibilidad)
            return handle_sqs_event(event, context)
            
    except Exception as e:
        print(f"❌ Error general en lambda_processor: {e}")
        import traceback
        print(f"❌ Stack trace: {traceback.format_exc()}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Error en procesamiento'
            })
        }

def handle_debounce_event(event, context):
    """
    Maneja eventos de debounce desde EventBridge Scheduler.
    """
    try:
        lead_id = event['lead_id']
        scheduled_time = event['scheduled_time']
        
        print(f"🕰️ Procesando evento de debounce para {lead_id}")
        
        from services.message_debounce import process_debounced_messages
        success = process_debounced_messages(lead_id, scheduled_time)
        
        return {
            'statusCode': 200 if success else 500,
            'body': json.dumps({
                'message': f'Debounce procesado para {lead_id}',
                'success': success
            })
        }
        
    except Exception as e:
        print(f"❌ Error en handle_debounce_event: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def handle_sqs_event(event, context):
    """
    Maneja eventos tradicionales de SQS (compatibilidad hacia atrás).
    """
    try:
        print(f"📦 Recibidos {len(event.get('Records', []))} registros de SQS")
        
        # Agrupar mensajes por lead_id
        messages_by_lead = defaultdict(list)
        
        print(f"🔍 Registros SQS recibidos:")
        for i, record in enumerate(event.get('Records', [])):
            print(f"  {i+1}. Body: {record.get('body', 'N/A')[:100]}...")
        
        for record in event.get('Records', []):
            try:
                # Parsear mensaje de SQS
                message_body = json.loads(record['body'])
                lead_id = message_body.get('lead_id')
                message = message_body.get('message')
                timestamp = message_body.get('timestamp')
                
                if not lead_id or not message:
                    print(f"❌ Mensaje inválido: {message_body}")
                    continue
                
                print(f"📱 Recibido: {lead_id} -> '{message}' (timestamp: {timestamp})")
                
                # Agregar al grupo del lead
                messages_by_lead[lead_id].append({
                    'message': message,
                    'timestamp': timestamp
                })
                
            except Exception as e:
                print(f"❌ Error procesando registro: {e}")
        
        # Mostrar resumen de agrupación
        print(f"📋 Resumen de agrupación:")
        for lead_id, messages in messages_by_lead.items():
            print(f"  Lead {lead_id}: {len(messages)} mensajes")
        
        # Procesar cada lead
        processed_leads = 0
        
        for lead_id, messages in messages_by_lead.items():
            try:
                print(f"🔄 Procesando lead {lead_id} con {len(messages)} mensajes")
                
                # Ordenar mensajes por timestamp para mantener orden cronológico
                sorted_messages = sorted(messages, key=lambda x: x.get('timestamp', ''))
                
                # Combinar mensajes de forma más inteligente
                message_texts = [msg['message'].strip() for msg in sorted_messages if msg['message'].strip()]
                
                if len(message_texts) == 1:
                    combined_message = message_texts[0]
                elif len(message_texts) <= 3:
                    # Para pocos mensajes, combinar con punto y espacio
                    combined_message = ". ".join(message_texts)
                else:
                    # Para muchos mensajes, tomar primero y últimos 2
                    combined_message = f"{message_texts[0]}. {message_texts[-2]}. {message_texts[-1]}"
                
                print(f"💬 Mensaje combinado: '{combined_message}'")
                print(f"📝 Mensajes originales: {[msg['message'] for msg in sorted_messages]}")
                
                # Llamar al webhook principal con el mensaje combinado
                webhook_response = call_webhook(lead_id, combined_message)
                
                if webhook_response:
                    print(f"✅ Webhook respondió correctamente para {lead_id}")
                    processed_leads += 1
                else:
                    print(f"⚠️ Error en webhook para {lead_id}")
                
            except Exception as e:
                print(f"❌ Error procesando lead {lead_id}: {e}")
        
        # Respuesta del Lambda
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Procesamiento con batching completado',
                'processed_leads': processed_leads,
                'total_leads': len(messages_by_lead),
                'total_messages': sum(len(msgs) for msgs in messages_by_lead.values())
            })
        }
        
    except Exception as e:
        print(f"❌ Error en handle_sqs_event: {e}")
        import traceback
        print(f"❌ Stack trace: {traceback.format_exc()}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Error en procesamiento SQS'
            })
        }

def call_webhook(lead_id: str, combined_message: str) -> bool:
    """
    Llama al webhook principal con el mensaje combinado.
    """
    try:
        # URL del webhook principal
        webhook_url = os.getenv('WEBHOOK_URL', 'https://rmys43m4av7y4kptnnvacfsmu40olhvq.lambda-url.us-east-2.on.aws/webhook')
        
        # Datos para el webhook
        webhook_data = {
            'From': lead_id,
            'Body': combined_message
        }
        
        print(f"📤 Llamando webhook: {webhook_url}")
        print(f"📤 Datos: From={lead_id}, Body='{combined_message}'")
        
        # Hacer la llamada HTTP
        response = requests.post(
            webhook_url,
            data=webhook_data,
            headers={
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-From-Processor': 'true'  # Identificar que viene del processor
            },
            timeout=30
        )
        
        if response.status_code == 200:
            print(f"✅ Webhook exitoso: {response.status_code}")
            print(f"📥 Respuesta: {response.text[:200]}...")
            return True
        else:
            print(f"❌ Webhook falló: {response.status_code}")
            print(f"❌ Error: {response.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"❌ Error llamando webhook: {e}")
        return False