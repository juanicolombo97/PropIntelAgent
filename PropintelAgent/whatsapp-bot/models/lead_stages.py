# models/lead_stages.py
from enum import Enum
from typing import Dict, Any, Optional
from dataclasses import dataclass

class LeadStage(Enum):
    """Etapas del lead en el proceso de conversión"""
    PRECALIFICACION = "PRECALIFICACION"  # Respondiendo dudas, identificando propiedad
    CALIFICACION = "CALIFICACION"       # Haciendo preguntas para calificar
    POST_CALIFICACION = "POST_CALIFICACION"  # Agendando visita o rechazando
    FINALIZADO = "FINALIZADO"           # Proceso terminado (visitó o se descalificó)

class LeadStatus(Enum):
    """Estados del lead dentro de cada etapa"""
    # PRECALIFICACION
    NUEVO = "NUEVO"                     # Recién llegó
    BUSCANDO_PROPIEDAD = "BUSCANDO_PROPIEDAD"  # Identificando qué propiedad busca
    PROPIEDAD_PENDIENTE = "PROPIEDAD_PENDIENTE"  # Esperando confirmación de propiedad
    
    # CALIFICACION  
    CALIFICANDO = "CALIFICANDO"         # Haciendo preguntas de calificación
    CALIFICADO = "CALIFICADO"           # Pasó la calificación
    DESCALIFICADO = "DESCALIFICADO"     # No pasó la calificación
    
    # POST_CALIFICACION
    AGENDANDO_VISITA = "AGENDANDO_VISITA"  # Coordinando fecha/hora
    VISITA_AGENDADA = "VISITA_AGENDADA"    # Visita confirmada
    
    # FINALIZADO
    PROCESO_COMPLETADO = "PROCESO_COMPLETADO"  # Ya visitó o proceso terminado

@dataclass
class LeadQualificationData:
    """Datos específicos de calificación del lead"""
    # Datos básicos de la propiedad
    property_confirmed: bool = False
    property_id: Optional[str] = None
    
    # Preguntas de calificación
    buyer_confirmed: bool = False      # Es para él/ella
    motive_confirmed: bool = False     # Motivo (mudanza/inversión)
    timeline_confirmed: bool = False   # Cuándo y hace cuánto busca
    financing_confirmed: bool = False  # Cómo financia
    ready_to_close: bool = False      # Listo para avanzar
    
    # Datos adicionales
    needs_to_sell: Optional[bool] = None
    has_preapproval: Optional[bool] = None
    decision_maker: bool = False
    
    def is_qualified(self) -> bool:
        """Determina si el lead está calificado para una visita"""
        required_fields = [
            self.property_confirmed,
            self.buyer_confirmed,
            self.motive_confirmed,
            self.financing_confirmed,
            self.ready_to_close
        ]
        return all(required_fields)
    
    def missing_qualification_data(self) -> list[str]:
        """Retorna lista de datos faltantes para calificación"""
        missing = []
        if not self.property_confirmed:
            missing.append("propiedad_confirmada")
        if not self.buyer_confirmed:
            missing.append("comprador_confirmado")
        if not self.motive_confirmed:
            missing.append("motivo")
        if not self.financing_confirmed:
            missing.append("financiacion")
        if not self.ready_to_close:
            missing.append("listo_para_cerrar")
        return missing

def get_next_stage(current_stage: LeadStage, current_status: LeadStatus, 
                  qualification_data: LeadQualificationData) -> tuple[LeadStage, LeadStatus]:
    """
    Determina la siguiente etapa y estado basado en el estado actual y datos de calificación
    """
    
    if current_stage == LeadStage.PRECALIFICACION:
        if current_status == LeadStatus.NUEVO:
            return LeadStage.PRECALIFICACION, LeadStatus.BUSCANDO_PROPIEDAD
        elif current_status == LeadStatus.BUSCANDO_PROPIEDAD:
            if qualification_data.property_confirmed:
                return LeadStage.CALIFICACION, LeadStatus.CALIFICANDO
            else:
                return LeadStage.PRECALIFICACION, LeadStatus.PROPIEDAD_PENDIENTE
        elif current_status == LeadStatus.PROPIEDAD_PENDIENTE:
            if qualification_data.property_confirmed:
                return LeadStage.CALIFICACION, LeadStatus.CALIFICANDO
            else:
                return LeadStage.PRECALIFICACION, LeadStatus.BUSCANDO_PROPIEDAD
    
    elif current_stage == LeadStage.CALIFICACION:
        if qualification_data.is_qualified():
            return LeadStage.POST_CALIFICACION, LeadStatus.AGENDANDO_VISITA
        elif len(qualification_data.missing_qualification_data()) == 0:
            # Tiene todos los datos pero no califica
            return LeadStage.POST_CALIFICACION, LeadStatus.DESCALIFICADO
        else:
            return LeadStage.CALIFICACION, LeadStatus.CALIFICANDO
    
    elif current_stage == LeadStage.POST_CALIFICACION:
        if current_status == LeadStatus.AGENDANDO_VISITA:
            # Se mantiene hasta que se agende la visita
            return LeadStage.POST_CALIFICACION, LeadStatus.AGENDANDO_VISITA
        elif current_status == LeadStatus.VISITA_AGENDADA:
            return LeadStage.FINALIZADO, LeadStatus.PROCESO_COMPLETADO
        elif current_status == LeadStatus.DESCALIFICADO:
            return LeadStage.FINALIZADO, LeadStatus.PROCESO_COMPLETADO
    
    # Por defecto, mantener estado actual
    return current_stage, current_status

def should_transition_to_qualification(messages_history: list, property_confirmed: bool) -> bool:
    """
    Determina si debe transicionar de precalificación a calificación
    """
    # Si ya confirmó la propiedad, puede pasar a calificación
    if property_confirmed:
        return True
    
    # Si ha mencionado una propiedad específica varias veces
    property_mentions = 0
    for msg in messages_history[-5:]:  # Últimos 5 mensajes
        if msg.get("role") == "user":
            content = msg.get("content", "").lower()
            property_keywords = ["propiedad", "casa", "depto", "departamento", "ph", "visita"]
            if any(keyword in content for keyword in property_keywords):
                property_mentions += 1
    
    return property_mentions >= 2

def get_stage_context_limit(stage: LeadStage) -> int:
    """
    Retorna el límite de mensajes de contexto según la etapa
    """
    context_limits = {
        LeadStage.PRECALIFICACION: 10,      # Más contexto para entender qué busca
        LeadStage.CALIFICACION: 6,          # Contexto medio para preguntas específicas  
        LeadStage.POST_CALIFICACION: 4,     # Poco contexto, solo para agendar
        LeadStage.FINALIZADO: 2             # Mínimo contexto
    }
    return context_limits.get(stage, 6)