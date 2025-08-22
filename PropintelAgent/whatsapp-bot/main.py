import os
import time
from urllib.parse import parse_qs

import boto3
from fastapi import FastAPI, Form
from fastapi.responses import PlainTextResponse
from mangum import Mangum

# Config
TABLE_NAME = os.getenv("LEADS_TABLE", "Leads")

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)

app = FastAPI()

@app.get("/")
def health():
    return {"status": "ok", "table": TABLE_NAME}

@app.post("/webhook")
async def whatsapp_webhook(
    From: str = Form(...),      # e.g. "whatsapp:+54911..."
    Body: str = Form(...),      # mensaje de texto
):
    # Timestamp como string para sort key
    ts = str(int(time.time()))

    # Guardar mensaje en DynamoDB
    item = {
        "Phone": From,
        "Timestamp": ts,
        "Message": Body,
        # Espacio para enriquecer luego:
        "Status": "NEW",         # NEW / QUALIFIED / REJECTED
        "Source": "whatsapp",    # canal
    }

    try:
        table.put_item(Item=item)
        print(f"[DDB] Saved: {item}")
    except Exception as e:
        # Si algo falla en DB, igual respondemos a WhatsApp para no cortar la conversación
        print(f"[DDB][ERROR] {e}")

    # Respuesta simple a WhatsApp
    reply = f"Recibí tu mensaje: {Body}"
    xml = f"<Response><Message>{reply}</Message></Response>"
    return PlainTextResponse(xml, media_type="application/xml")


# Endpoint simple para consultar últimos N mensajes de un phone (para test)
@app.get("/leads")
def list_lead_messages(phone: str, limit: int = 10):
    """
    Ej: GET /leads?phone=whatsapp:+5491112345678&limit=5
    """
    resp = table.query(
        KeyConditionExpression="#P = :phone",
        ExpressionAttributeNames={"#P": "Phone"},
        ExpressionAttributeValues={":phone": phone},
        ScanIndexForward=False,  # descendente (más nuevos primero)
        Limit=limit
    )
    return {"items": resp.get("Items", [])}


handler = Mangum(app)
