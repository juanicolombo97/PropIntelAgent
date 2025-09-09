# services/property_search.py
"""
Servicio robusto de búsqueda de propiedades que SOLO usa datos reales de la BD.
NUNCA inventa o alucina propiedades.
"""

from typing import Dict, Any, List, Optional, Tuple
from boto3.dynamodb.conditions import Attr, Key
from models.schemas import dec_to_native


class PropertySearchService:
    """Servicio para búsqueda inteligente de propiedades"""
    
    def __init__(self, t_props):
        self.t_props = t_props
    
    def search_by_url(self, message_text: str) -> Optional[Dict[str, Any]]:
        """
        Busca una propiedad específica por URL en el mensaje.
        Retorna la propiedad si existe, None si no encuentra nada.
        """
        import re
        
        # Detectar URLs en el mensaje
        url_pattern = r'https?://[^\s]+'
        urls = re.findall(url_pattern, message_text)
        
        if not urls:
            return None
        
        try:
            for url in urls:
                print(f"[SEARCH] Buscando propiedad por URL: {url}")
                
                # Buscar por coincidencia del final del URL
                url_suffix = url.split('/')[-1]
                
                resp = self.t_props.scan(
                    FilterExpression=Attr("URL").contains(url_suffix) & Attr("Status").eq("ACTIVE"),
                    Limit=5
                )
                
                items = resp.get("Items", [])
                
                # Verificar coincidencia exacta
                for item in items:
                    prop = dec_to_native(item)
                    if prop.get("URL") == url:
                        print(f"[SEARCH] ✅ Propiedad encontrada por URL: {prop.get('Title')}")
                        return self._format_property(prop)
                
                print(f"[SEARCH] ❌ No se encontró propiedad para URL: {url}")
            
            return None
            
        except Exception as e:
            print(f"[SEARCH][URL][ERROR] {e}")
            return None
    
    def search_by_criteria(self, lead_data: Dict[str, Any], message_text: str = "") -> Tuple[List[Dict[str, Any]], str]:
        """
        Busca propiedades usando criterios del lead y mensaje.
        
        Returns:
            (propiedades_encontradas, mensaje_para_usuario)
        """
        try:
            # Extraer criterios disponibles
            criteria = self._extract_search_criteria(lead_data, message_text)
            
            if not criteria:
                return [], "Para ayudarte mejor, necesito saber que tipo de propiedad buscas. Que zona te interesa?"
            
            # Buscar propiedades que coincidan
            properties = self._find_properties_by_criteria(criteria)
            
            # Generar mensaje según resultados
            if len(properties) == 0:
                missing_criteria = self._get_missing_criteria(criteria)
                if missing_criteria:
                    return [], f"No tengo propiedades disponibles con esos criterios. {missing_criteria}"
                else:
                    return [], "No tengo propiedades disponibles que coincidan con lo que buscas. Podes darme otros criterios?"
            
            elif len(properties) == 1:
                # Una sola propiedad encontrada - confirmar
                prop = properties[0]
                return properties, f"Encontré esta propiedad: {prop['Title']} en {prop['Neighborhood']}. Es esta la que te interesa?"
            
            else:
                # Múltiples propiedades - pedir más detalles
                neighborhoods = list(set(p.get('Neighborhood', 'N/A') for p in properties))
                if len(neighborhoods) == 1:
                    # Todas en el mismo barrio, pedir más detalles
                    return properties, f"Tengo {len(properties)} propiedades en {neighborhoods[0]}. Me podes dar más detalles? Cuantos ambientes necesitas o cual es tu presupuesto?"
                else:
                    # En diferentes barrios
                    return properties, f"Tengo {len(properties)} propiedades disponibles. En que barrio específicamente te interesa?"
        
        except Exception as e:
            print(f"[SEARCH][CRITERIA][ERROR] {e}")
            return [], "Tuve un problema técnico buscando propiedades. Podes darme más detalles de lo que buscas?"
    
    def confirm_property_selection(self, properties: List[Dict[str, Any]], user_response: str) -> Optional[Dict[str, Any]]:
        """
        Confirma la selección de una propiedad específica basada en la respuesta del usuario.
        """
        if not properties or not user_response:
            return None
        
        user_response_lower = user_response.lower()
        
        # Si solo hay una propiedad y respuesta positiva
        if len(properties) == 1:
            positive_keywords = ["si", "sí", "si!", "correcto", "exacto", "esa es", "perfecto", "dale", "ok", "confirmo"]
            if any(keyword in user_response_lower for keyword in positive_keywords):
                return properties[0]
            
            negative_keywords = ["no", "no es", "otra", "diferente", "equivocada"]
            if any(keyword in user_response_lower for keyword in negative_keywords):
                return None
        
        # Si hay múltiples propiedades, buscar coincidencias específicas
        if len(properties) > 1:
            for prop in properties:
                title_words = prop.get('Title', '').lower().split()
                neighborhood = prop.get('Neighborhood', '').lower()
                
                # Buscar coincidencias en título o barrio
                if any(word in user_response_lower for word in title_words if len(word) > 3):
                    return prop
                
                if neighborhood in user_response_lower:
                    return prop
        
        return None
    
    def _extract_search_criteria(self, lead_data: Dict[str, Any], message_text: str) -> Dict[str, Any]:
        """Extrae criterios de búsqueda del lead y mensaje"""
        criteria = {}
        
        # Criterios del lead
        if lead_data.get("Neighborhood"):
            criteria["neighborhood"] = lead_data["Neighborhood"]
        
        if lead_data.get("Rooms"):
            criteria["rooms"] = lead_data["Rooms"]
        
        if lead_data.get("Budget"):
            criteria["budget"] = lead_data["Budget"]
        
        if lead_data.get("Intent"):
            criteria["intent"] = lead_data["Intent"]
        
        # Extraer criterios adicionales del mensaje actual
        if message_text:
            message_criteria = self._extract_criteria_from_message(message_text)
            criteria.update(message_criteria)
        
        return criteria
    
    def _extract_criteria_from_message(self, message_text: str) -> Dict[str, Any]:
        """Extrae criterios específicos del mensaje del usuario"""
        criteria = {}
        message_lower = message_text.lower()
        
        # Barrios conocidos
        barrios = {
            "nuñez": "Núñez", "palermo": "Palermo", "belgrano": "Belgrano",
            "recoleta": "Recoleta", "san telmo": "San Telmo", "puerto madero": "Puerto Madero",
            "villa crespo": "Villa Crespo", "caballito": "Caballito", "flores": "Flores",
            "barracas": "Barracas", "boca": "La Boca", "tigre": "Tigre",
            "vicente lopez": "Vicente López", "olivos": "Olivos", "martinez": "Martínez"
        }
        
        for barrio_key, barrio_nombre in barrios.items():
            if barrio_key in message_lower:
                criteria["neighborhood"] = barrio_nombre
                break
        
        # Número de ambientes
        import re
        room_patterns = [
            r"(\d+)\s*amb", r"(\d+)\s*habitac", r"(\d+)\s*dormitor",
            r"(\d+)\s*cuarto", r"monoambiente", r"mono"
        ]
        
        for pattern in room_patterns:
            match = re.search(pattern, message_lower)
            if match:
                if pattern in ["monoambiente", "mono"]:
                    criteria["rooms"] = 1
                else:
                    try:
                        criteria["rooms"] = int(match.group(1))
                    except:
                        pass
                break
        
        # Presupuesto
        budget_patterns = [
            r"(\d+)k", r"(\d+\.?\d*)\s*m", r"\$\s*(\d{1,3}(?:[.,]\d{3})*)",
            r"(\d{1,3}(?:[.,]\d{3})*)\s*peso", r"presupuesto.*?(\d{1,3}(?:[.,]\d{3})*)"
        ]
        
        for pattern in budget_patterns:
            match = re.search(pattern, message_lower)
            if match:
                try:
                    amount_str = match.group(1).replace(",", "").replace(".", "")
                    if "k" in pattern:
                        criteria["budget"] = int(float(amount_str) * 1000)
                    elif "m" in pattern:
                        criteria["budget"] = int(float(amount_str) * 1000000)
                    else:
                        criteria["budget"] = int(amount_str)
                    break
                except:
                    pass
        
        return criteria
    
    def _find_properties_by_criteria(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Busca propiedades que coincidan con los criterios"""
        try:
            filter_expr = Attr("Status").eq("ACTIVE")
            
            # Aplicar filtros disponibles
            if criteria.get("neighborhood"):
                filter_expr = filter_expr & Attr("Neighborhood").eq(criteria["neighborhood"])
            
            if criteria.get("rooms"):
                filter_expr = filter_expr & Attr("Rooms").eq(criteria["rooms"])
            
            if criteria.get("budget"):
                filter_expr = filter_expr & Attr("Price").lte(criteria["budget"])
            
            # Buscar en la BD
            resp = self.t_props.scan(FilterExpression=filter_expr, Limit=20)
            items = resp.get("Items", [])
            
            # Convertir y formatear
            properties = []
            for item in items:
                prop = dec_to_native(item)
                properties.append(self._format_property(prop))
            
            return properties
        
        except Exception as e:
            print(f"[SEARCH][FIND][ERROR] {e}")
            return []
    
    def _format_property(self, prop: Dict[str, Any]) -> Dict[str, Any]:
        """Formatea una propiedad para uso consistente"""
        return {
            "PropertyId": prop.get("PropertyId"),
            "Title": prop.get("Title", "Propiedad sin título"),
            "Neighborhood": prop.get("Neighborhood", "Zona no especificada"),
            "Rooms": prop.get("Rooms"),
            "Price": prop.get("Price"),
            "URL": prop.get("URL", "")
        }
    
    def _get_missing_criteria(self, criteria: Dict[str, Any]) -> str:
        """Genera sugerencia de criterios faltantes"""
        missing = []
        
        if not criteria.get("neighborhood"):
            missing.append("zona")
        
        if not criteria.get("rooms"):
            missing.append("cantidad de ambientes")
        
        if not criteria.get("budget"):
            missing.append("presupuesto")
        
        if missing:
            if len(missing) == 1:
                return f"Me podes decir la {missing[0]}?"
            elif len(missing) == 2:
                return f"Me podes decir la {missing[0]} y {missing[1]}?"
            else:
                return f"Me podes dar más detalles como {', '.join(missing[:-1])} y {missing[-1]}?"
        
        return ""
    
    def format_properties_list(self, properties: List[Dict[str, Any]], max_items: int = 3) -> str:
        """
        Formatea una lista de propiedades para mostrar al usuario.
        Solo se usa cuando el usuario pide explícitamente ver opciones.
        """
        if not properties:
            return "No hay propiedades disponibles."
        
        limited_props = properties[:max_items]
        lines = []
        
        for i, prop in enumerate(limited_props, 1):
            title = prop.get("Title", "Sin título")
            neighborhood = prop.get("Neighborhood", "N/A")
            rooms = prop.get("Rooms")
            price = prop.get("Price")
            
            # Formatear precio
            if isinstance(price, (int, float)) and price > 0:
                if price >= 1000000:
                    price_str = f"${price/1000000:.1f}M"
                elif price >= 1000:
                    price_str = f"${price/1000:.0f}k"
                else:
                    price_str = f"${price:,.0f}"
            else:
                price_str = "Consultar"
            
            # Formatear ambientes
            if isinstance(rooms, (int, float)):
                rooms_str = f"{int(rooms)} amb" if rooms > 1 else "1 amb"
            else:
                rooms_str = "N/A amb"
            
            line = f"{i}. {title} - {neighborhood} - {rooms_str} - {price_str}"
            lines.append(line)
        
        result = "\n".join(lines)
        
        if len(properties) > max_items:
            result += f"\n\n(Mostrando {max_items} de {len(properties)} disponibles)"
        
        return result


# Instancia global del servicio
def get_property_search_service():
    """Retorna una instancia del servicio de búsqueda"""
    from services.dynamo import t_props
    return PropertySearchService(t_props)