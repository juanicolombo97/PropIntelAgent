# services/stage_manager.py
"""
Gestor de etapas del lead. Maneja las transiciones entre etapas y 
la lógica de negocio para determinar cuándo un lead debe avanzar.
"""

from typing import Dict, Any, Tuple, Optional
from models.lead_stages import (
    LeadStage, LeadStatus, LeadQualificationData, 
    get_next_stage, should_transition_to_qualification
)
from services.dynamo import update_lead_stage_and_status, update_qualification_data

class StageManager:
    """Maneja las transiciones de etapas del lead"""
    
    def __init__(self):
        pass
    
    def analyze_message_for_qualification_data(self, message: str, conversation_history: list) -> Dict[str, Any]:
        """
        Analiza el mensaje del usuario para extraer datos de calificación
        """
        message_lower = message.lower()
        updates = {}
        
        # 1. Comprador confirmado
        buyer_keywords = ["para mi", "para mí", "es mío", "para mia", "mio", "mía", "soy yo", "es para mi"]
        if any(keyword in message_lower for keyword in buyer_keywords):
            updates["buyer_confirmed"] = True
            updates["decision_maker"] = True
        
        # 2. Motivo confirmado  
        mudanza_keywords = ["mudanza", "mudarme", "vivir", "casa nueva"]
        inversion_keywords = ["inversión", "invertir", "inversion", "inversor", "renta", "alquiler"]
        if any(keyword in message_lower for keyword in mudanza_keywords):
            updates["motive_confirmed"] = True
        elif any(keyword in message_lower for keyword in inversion_keywords):
            updates["motive_confirmed"] = True
        
        # 3. Financiación confirmada
        financing_keywords = ["ahorro", "efectivo", "tengo", "crédito", "banco", "preaprobado", "hipotecario"]
        if any(keyword in message_lower for keyword in financing_keywords):
            updates["financing_confirmed"] = True
            
        # Detectar si necesita vender
        sell_keywords = ["vender", "vendo", "tengo que vender", "necesito vender"]
        if any(keyword in message_lower for keyword in sell_keywords):
            updates["needs_to_sell"] = True
        
        # 4. Timeline confirmado (implícito si menciona urgencia)
        timeline_keywords = ["pronto", "rápido", "urgente", "ya", "este mes", "próximo mes"]
        if any(keyword in message_lower for keyword in timeline_keywords):
            updates["timeline_confirmed"] = True
        
        # 5. Listo para cerrar
        ready_keywords = ["puedo avanzar", "si me gusta", "estoy listo", "podemos coordinar", 
                         "quiero comprar", "quiero alquilar", "me interesa", "vamos", "dale"]
        if any(keyword in message_lower for keyword in ready_keywords):
            updates["ready_to_close"] = True
        
        return updates
    
    def check_property_confirmation(self, message: str) -> Optional[bool]:
        """
        Verifica si el usuario está confirmando o rechazando una propiedad
        """
        message_lower = message.lower()
        
        # Confirmación positiva
        positive_keywords = ["si", "sí", "si!", "correcto", "exacto", "esa es", "perfecto", "dale", "ok"]
        if any(keyword in message_lower for keyword in positive_keywords):
            return True
        
        # Confirmación negativa
        negative_keywords = ["no", "no es", "otra", "diferente", "equivocada"]
        if any(keyword in message_lower for keyword in negative_keywords):
            return False
        
        return None
    
    def should_advance_stage(self, lead_data: Dict[str, Any], message: str, 
                           conversation_history: list) -> Tuple[bool, str, str]:
        """
        Determina si el lead debe avanzar a la siguiente etapa
        
        Returns:
            (should_advance, new_stage, new_status)
        """
        current_stage = lead_data.get("Stage", "PRECALIFICACION")
        current_status = lead_data.get("Status", "NUEVO")
        qual_data = lead_data.get("QualificationData", {})
        
        print(f"🔄 Evaluando avance de etapa:")
        print(f"   Etapa actual: {current_stage}")
        print(f"   Estado actual: {current_status}")
        
        # PRECALIFICACIÓN → CALIFICACIÓN
        if current_stage == "PRECALIFICACION":
            # Verificar confirmación de propiedad
            property_confirmation = self.check_property_confirmation(message)
            if property_confirmation is True:
                # Verificar que realmente tenga una propiedad asignada
                property_id = lead_data.get("PropertyId")
                if property_id:
                    print("✅ Propiedad confirmada y existe en BD - avanzando a CALIFICACION")
                    return True, "CALIFICACION", "CALIFICANDO"
                else:
                    print("❌ Propiedad confirmada pero no existe en BD - mantener en PRECALIFICACION")
                    return False, current_stage, "BUSCANDO_PROPIEDAD"
            elif property_confirmation is False:
                print("❌ Propiedad rechazada - mantener en PRECALIFICACION")
                return False, current_stage, "BUSCANDO_PROPIEDAD"
            
            # Si ya tiene propiedad confirmada en datos anteriores
            if qual_data.get("property_confirmed", False) and lead_data.get("PropertyId"):
                print("✅ Propiedad ya confirmada previamente y existe en BD - avanzando a CALIFICACION")
                return True, "CALIFICACION", "CALIFICANDO"
        
        # CALIFICACIÓN → POST-CALIFICACIÓN
        elif current_stage == "CALIFICACION":
            # Crear objeto de calificación para evaluar
            qualification = LeadQualificationData(
                property_confirmed=qual_data.get("property_confirmed", False),
                buyer_confirmed=qual_data.get("buyer_confirmed", False),
                motive_confirmed=qual_data.get("motive_confirmed", False),
                timeline_confirmed=qual_data.get("timeline_confirmed", False),
                financing_confirmed=qual_data.get("financing_confirmed", False),
                ready_to_close=qual_data.get("ready_to_close", False),
                needs_to_sell=qual_data.get("needs_to_sell"),
                has_preapproval=qual_data.get("has_preapproval"),
                decision_maker=qual_data.get("decision_maker", False)
            )
            
            missing_data = qualification.missing_qualification_data()
            print(f"   Datos faltantes: {missing_data}")
            
            # Si tiene todos los datos, evaluar calificación
            if len(missing_data) == 0:
                if qualification.is_qualified():
                    print("✅ Lead calificado - avanzando a POST_CALIFICACION")
                    return True, "POST_CALIFICACION", "AGENDANDO_VISITA"
                else:
                    print("❌ Lead no calificado - avanzando a POST_CALIFICACION")
                    return True, "POST_CALIFICACION", "DESCALIFICADO"
        
        # POST-CALIFICACIÓN → FINALIZADO
        elif current_stage == "POST_CALIFICACION":
            # Si se detecta fecha/hora para visita
            if any(word in message.lower() for word in ["mañana", "hoy", "lunes", "martes", "miércoles", 
                                                       "jueves", "viernes", "sábado", "domingo", "hs", "am", "pm"]):
                print("📅 Fecha detectada - manteniendo en POST_CALIFICACION para procesar")
                return False, current_stage, "AGENDANDO_VISITA"
        
        # No avanzar por defecto
        return False, current_stage, current_status
    
    def process_stage_transition(self, lead_id: str, lead_data: Dict[str, Any], 
                               message: str, conversation_history: list) -> Dict[str, Any]:
        """
        Procesa una posible transición de etapa y actualiza el lead
        
        Returns:
            Updated lead data
        """
        # Analizar mensaje para datos de calificación
        qualification_updates = self.analyze_message_for_qualification_data(message, conversation_history)
        
        # Obtener datos de calificación actuales
        current_qual_data = lead_data.get("QualificationData", {})
        
        # Actualizar datos de calificación si hay cambios
        if qualification_updates:
            update_qualification_data(lead_id, qualification_updates)
            # Actualizar datos locales
            current_qual_data.update(qualification_updates)
            lead_data["QualificationData"] = current_qual_data
        
        # Verificar si debe avanzar de etapa
        should_advance, new_stage, new_status = self.should_advance_stage(
            lead_data, message, conversation_history
        )
        
        # Actualizar etapa si es necesario
        if should_advance or new_status != lead_data.get("Status"):
            update_lead_stage_and_status(lead_id, new_stage, new_status)
            lead_data["Stage"] = new_stage
            lead_data["Status"] = new_status
            
            # Actualizaciones específicas por etapa
            additional_updates = {}
            
            if new_stage == "CALIFICACION" and qualification_updates.get("property_confirmed") is None:
                # Si avanza a calificación por confirmación de propiedad
                additional_updates["QualificationData"] = current_qual_data
                additional_updates["QualificationData"]["property_confirmed"] = True
                update_qualification_data(lead_id, {"property_confirmed": True})
            
            if additional_updates:
                from services.dynamo import update_lead
                update_lead(lead_id, additional_updates)
                lead_data.update(additional_updates)
        
        return lead_data
    
    def get_missing_qualification_data(self, qual_data: Dict[str, Any]) -> list[str]:
        """
        Retorna una lista de datos de calificación que faltan
        """
        qualification = LeadQualificationData(
            property_confirmed=qual_data.get("property_confirmed", False),
            buyer_confirmed=qual_data.get("buyer_confirmed", False),
            motive_confirmed=qual_data.get("motive_confirmed", False),
            timeline_confirmed=qual_data.get("timeline_confirmed", False),
            financing_confirmed=qual_data.get("financing_confirmed", False),
            ready_to_close=qual_data.get("ready_to_close", False),
            needs_to_sell=qual_data.get("needs_to_sell"),
            has_preapproval=qual_data.get("has_preapproval"),
            decision_maker=qual_data.get("decision_maker", False)
        )
        
        return qualification.missing_qualification_data()

# Instancia global del gestor
stage_manager = StageManager()