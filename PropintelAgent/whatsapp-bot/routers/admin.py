# routers/admin.py
import os
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse
from fastapi import Depends, Header, HTTPException
from pydantic import BaseModel

from boto3.dynamodb.conditions import Key, Attr
from services.dynamo import t_leads, t_msgs, t_props, t_visits
from models.schemas import dec_to_native

router = APIRouter(prefix="/admin")

# Modelos para autenticación
class LoginRequest(BaseModel):
    username: str
    password: str

class ValidateRequest(BaseModel):
    username: str

# Función de autenticación
def verify_api_key(x_api_key: str = Header(None)):
    admin_api_key = os.getenv("ADMIN_API_KEY")
    if not admin_api_key:
        # Si no hay API key configurada, permitir acceso (solo para desarrollo)
        return True
    
    if not x_api_key or x_api_key != admin_api_key:
        raise HTTPException(status_code=401, detail="API key inválida")
    
    return True

# Función para verificar credenciales
def verify_credentials(username: str, password: str) -> Dict[str, Any] | None:
    """
    Verifica credenciales contra variables de entorno o base de datos.
    En producción, esto debería consultar una tabla de usuarios en DynamoDB.
    """
    # Credenciales desde variables de entorno
    valid_users = {}
    
    # Usuario principal desde variables de entorno
    admin_username = os.getenv("ADMIN_USERNAME")
    admin_password = os.getenv("ADMIN_PASSWORD") 
    admin_email = os.getenv("ADMIN_EMAIL", "admin@propintel.com")
    
    if admin_username and admin_password:
        valid_users[admin_username] = {
            "password": admin_password,
            "role": "admin",
            "email": admin_email
        }
    
    # Usuarios adicionales desde variables de entorno (formato: USER_username_PASSWORD, USER_username_EMAIL, USER_username_ROLE)
    for key, value in os.environ.items():
        if key.startswith("USER_") and key.endswith("_PASSWORD"):
            user_prefix = key[5:-9]  # Extraer username del formato USER_username_PASSWORD
            user_email = os.getenv(f"USER_{user_prefix}_EMAIL", f"{user_prefix.lower()}@propintel.com")
            user_role = os.getenv(f"USER_{user_prefix}_ROLE", "user")
            
            valid_users[user_prefix.lower()] = {
                "password": value,
                "role": user_role,
                "email": user_email
            }
    
    # Verificar credenciales
    if username.lower() in valid_users:
        user_data = valid_users[username.lower()]
        if user_data["password"] == password:
            return {
                "username": username,
                "role": user_data["role"],
                "email": user_data["email"]
            }
    
    return None

@router.post("/auth/login")
def login(request: LoginRequest):
    """Endpoint para autenticación de usuarios"""
    user = verify_credentials(request.username, request.password)
    
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    return {
        "success": True,
        "user": user,
        "message": "Autenticación exitosa"
    }

@router.post("/auth/validate") 
def validate_user(request: ValidateRequest):
    """Endpoint para validar si un usuario existe"""
    # En este caso simple, solo verificamos si el usuario está en las variables de entorno
    admin_username = os.getenv("ADMIN_USERNAME")
    
    if request.username == admin_username:
        return {
            "success": True,
            "user": {
                "username": request.username,
                "role": "admin",
                "email": os.getenv("ADMIN_EMAIL", "admin@propintel.com")
            }
        }
    
    # Verificar usuarios adicionales
    for key in os.environ.keys():
        if key.startswith("USER_") and key.endswith("_PASSWORD"):
            user_prefix = key[5:-9]
            if user_prefix.lower() == request.username.lower():
                return {
                    "success": True,
                    "user": {
                        "username": request.username,
                        "role": os.getenv(f"USER_{user_prefix}_ROLE", "user"),
                        "email": os.getenv(f"USER_{user_prefix}_EMAIL", f"{user_prefix.lower()}@propintel.com")
                    }
                }
    
    raise HTTPException(status_code=404, detail="Usuario no encontrado")



@router.get("/leads")
def list_leads(status: str | None = None, limit: int = 50, _: bool = Depends(verify_api_key)):
    if status:
        # requiere GSI_Status (Status + UpdatedAt)
        resp = t_leads.query(
            IndexName="GSI_Status",
            KeyConditionExpression=Key("Status").eq(status),
            ScanIndexForward=False,
            Limit=limit
        )
        items = resp.get("Items", [])
    else:
        # sin filtro → NO hay scan aquí para no romper costos; pedí siempre por status
        items = []
    return {"items": dec_to_native(items)}

@router.get("/lead")
def get_lead(lead_id: str, _: bool = Depends(verify_api_key)):
    resp = t_leads.get_item(Key={"LeadId": lead_id})
    return JSONResponse(dec_to_native(resp.get("Item", {})))

@router.post("/leads")
def create_lead(item: dict = Body(...), _: bool = Depends(verify_api_key)):
    # Espera: {LeadId, Phone, Intent, Neighborhood, Rooms, Budget, Status, Stage, Notes, CreatedAt, UpdatedAt}
    t_leads.put_item(Item=item)
    return {"ok": True, "id": item.get("LeadId")}

@router.get("/messages")
def get_messages(lead_id: str, limit: int = 50, _: bool = Depends(verify_api_key)):
    resp = t_msgs.query(
        KeyConditionExpression=Key("LeadId").eq(lead_id),
        ScanIndexForward=False,
        Limit=limit
    )
    return {"items": dec_to_native(resp.get("Items", []))}

@router.get("/properties")
def get_properties(neighborhood: str | None = None, limit: int = 100, _: bool = Depends(verify_api_key)):
    if neighborhood:
        resp = t_props.scan(
            FilterExpression=Attr("Status").eq("ACTIVE") & Attr("Neighborhood").eq(neighborhood)
        )
    else:
        resp = t_props.scan(
            FilterExpression=Attr("Status").eq("ACTIVE")
        )
    items = resp.get("Items", [])
    return {"items": dec_to_native(items[:limit])}

@router.post("/properties")
def create_property(item: dict = Body(...), _: bool = Depends(verify_api_key)):
    # Espera: {PropertyId, Title, Neighborhood, Rooms, Price, Status, URL}
    t_props.put_item(Item=item)
    return {"ok": True, "id": item.get("PropertyId")}

@router.put("/properties/{property_id}")
def update_property(property_id: str, fields: dict = Body(...), _: bool = Depends(verify_api_key)):
    # build update expression dinámico
    expr_names, expr_values, sets = {}, {}, []
    i = 0
    for k, v in fields.items():
        i += 1
        nk, nv = f"#F{i}", f":v{i}"
        expr_names[nk] = k
        expr_values[nv] = v
        sets.append(f"{nk} = {nv}")
    t_props.update_item(
        Key={"PropertyId": property_id},
        UpdateExpression="SET " + ", ".join(sets),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
    )
    return {"ok": True}

@router.get("/visits")
def list_visits(lead_id: str | None = None, property_id: str | None = None, limit: int = 50, _: bool = Depends(verify_api_key)):
    if lead_id:
        resp = t_visits.query(
            KeyConditionExpression=Key("LeadId").eq(lead_id),
            ScanIndexForward=False,
            Limit=limit
        )
        return {"items": dec_to_native(resp.get("Items", []))}
    if property_id:
        resp = t_visits.query(
            IndexName="GSI_Property",
            KeyConditionExpression=Key("PropertyId").eq(property_id),
            ScanIndexForward=False,
            Limit=limit
        )
        return {"items": dec_to_native(resp.get("Items", []))}
    # Si no se especifica filtro, listar todas las visitas
    resp = t_visits.scan(Limit=limit)
    return {"items": dec_to_native(resp.get("Items", []))}

@router.put("/visits/confirm")
def confirm_visit(lead_id: str, visit_at: str, confirmed: bool = True, _: bool = Depends(verify_api_key)):
    t_visits.update_item(
        Key={"LeadId": lead_id, "VisitAt": visit_at},
        UpdateExpression="SET Confirmed = :c",
        ExpressionAttributeValues={":c": confirmed}
    )
    return {"ok": True}

@router.post("/visits")
def create_visit(item: dict = Body(...), _: bool = Depends(verify_api_key)):
    # Espera: {LeadId, VisitAt, PropertyId, Confirmed}
    t_visits.put_item(Item=item)
    return {"ok": True, "id": f"{item.get('LeadId')}-{item.get('VisitAt')}"}

@router.get("/pending-messages")
def get_pending_messages(lead_id: str, _: bool = Depends(verify_api_key)):
    """
    Verifica si hay mensajes pendientes en la tabla de debounce para un lead específico
    """
    try:
        # Verificar si existe la tabla de mensajes pendientes
        pending_table_name = os.getenv("PENDING_MESSAGES_TABLE")
        if not pending_table_name:
            return {"hasPendingMessages": False, "message": "Debounce system not configured"}
        
        # Importar la tabla de mensajes pendientes
        from services.dynamo import get_dynamo_resource
        dynamodb = get_dynamo_resource()
        pending_table = dynamodb.Table(pending_table_name)
        
        # Buscar mensajes pendientes para este lead
        response = pending_table.query(
            KeyConditionExpression=Key('LeadId').eq(lead_id)
        )
        
        has_pending = len(response.get('Items', [])) > 0
        
        return {
            "hasPendingMessages": has_pending,
            "count": len(response.get('Items', [])),
            "lead_id": lead_id
        }
        
    except Exception as e:
        print(f"❌ Error verificando mensajes pendientes: {e}")
        return {"hasPendingMessages": False, "error": str(e)}
