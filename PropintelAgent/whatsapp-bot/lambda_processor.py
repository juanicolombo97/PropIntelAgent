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
    Handler del Lambda Procesador - Agrupa mensajes y llama al webhook.
    """
    try:
        print(f"🔄 Lambda Procesador iniciado")
        print(f"📦 Recibidos {len(event.get('Records', []))} registros de SQS")
        
        # Agrupar mensajes por lead_id
        messages_by_lead = defaultdict(list)
        
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
                
                print(f"📱 Recibido: {lead_id} -> '{message}'")
                
                # Agregar al grupo del lead
                messages_by_lead[lead_id].append({
                    'message': message,
                    'timestamp': timestamp
                })
                
            except Exception as e:
                print(f"❌ Error procesando registro: {e}")
        
        # Procesar cada lead
        processed_leads = 0
        
        for lead_id, messages in messages_by_lead.items():
            try:
                print(f"🔄 Procesando lead {lead_id} con {len(messages)} mensajes")
                
                # Combinar mensajes
                combined_message = " ".join([msg['message'] for msg in messages])
                print(f"💬 Mensaje combinado: '{combined_message}'")
                
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