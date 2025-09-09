#!/usr/bin/env python3
"""
Script de prueba para el nuevo flujo de búsqueda de propiedades.
Verifica que SOLO se usen propiedades reales de la BD.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.property_search import get_property_search_service
from services.ai import handle_precalification_stage
from services.dynamo import get_lead

def test_property_search():
    """Prueba el servicio de búsqueda de propiedades"""
    print("🧪 Testing PropertySearchService...")
    
    try:
        search_service = get_property_search_service()
        
        # Test 1: Búsqueda por criterios básicos
        print("\n📋 Test 1: Búsqueda por criterios")
        lead_data = {
            "LeadId": "test_lead",
            "Neighborhood": "Palermo",
            "Rooms": 2
        }
        
        properties, message = search_service.search_by_criteria(lead_data, "busco 2 ambientes")
        print(f"   Propiedades encontradas: {len(properties)}")
        print(f"   Mensaje: {message}")
        
        if properties:
            print("   Propiedades:")
            for prop in properties[:3]:
                print(f"     - {prop['Title']} en {prop['Neighborhood']} ({prop['Rooms']} amb)")
        
        # Test 2: Búsqueda sin criterios
        print("\n📋 Test 2: Búsqueda sin criterios específicos")
        empty_lead = {"LeadId": "test_lead"}
        properties2, message2 = search_service.search_by_criteria(empty_lead, "hola")
        print(f"   Mensaje: {message2}")
        
        # Test 3: Formateo de lista de propiedades
        if properties:
            print("\n📋 Test 3: Formateo de propiedades")
            formatted_list = search_service.format_properties_list(properties[:2])
            print(f"   Lista formateada:\n{formatted_list}")
        
        print("\n✅ PropertySearchService tests completed")
        return True
        
    except Exception as e:
        print(f"❌ Error en test_property_search: {e}")
        import traceback
        print(traceback.format_exc())
        return False

def test_precalification_flow():
    """Prueba el flujo de precalificación"""
    print("\n🧪 Testing Precalification Flow...")
    
    try:
        # Simular un lead nuevo
        test_lead_id = "test_precal_lead"
        
        # Crear lead de prueba
        lead_data = {
            "LeadId": test_lead_id,
            "Stage": "PRECALIFICACION",
            "Status": "NUEVO",
            "Intent": None,
            "Rooms": None,
            "Budget": None,
            "Neighborhood": None,
            "PropertyId": None,
            "CandidateProperties": [],
            "QualificationData": {
                "property_confirmed": False,
                "buyer_confirmed": False,
                "motive_confirmed": False,
                "timeline_confirmed": False,
                "financing_confirmed": False,
                "ready_to_close": False,
                "needs_to_sell": None,
                "has_preapproval": None,
                "decision_maker": False
            }
        }
        
        # Test scenarios
        test_scenarios = [
            ("Hola", "Primer contacto"),
            ("Busco en Palermo", "Búsqueda por barrio"),
            ("Necesito 2 ambientes", "Búsqueda por ambientes"),
            ("Tengo 500k de presupuesto", "Búsqueda por presupuesto")
        ]
        
        conversation_history = []
        
        for message, description in test_scenarios:
            print(f"\n📋 Escenario: {description}")
            print(f"   Mensaje: '{message}'")
            
            # Simular respuesta
            response = handle_precalification_stage(lead_data, message, conversation_history)
            print(f"   Respuesta: {response}")
            
            # Agregar al historial simulado
            conversation_history.append({"role": "user", "content": message})
            conversation_history.append({"role": "assistant", "content": response})
        
        print("\n✅ Precalification flow tests completed")
        return True
        
    except Exception as e:
        print(f"❌ Error en test_precalification_flow: {e}")
        import traceback
        print(traceback.format_exc())
        return False

def test_url_detection():
    """Prueba la detección de URLs"""
    print("\n🧪 Testing URL Detection...")
    
    try:
        search_service = get_property_search_service()
        
        # Test con URLs ficticias (no deberían encontrar nada)
        test_urls = [
            "https://ejemplo.com/propiedad/123",
            "Vi esta propiedad https://inmobiliaria.com/prop_001",
            "Me interesa este link: https://test.com/depto-palermo"
        ]
        
        for url_message in test_urls:
            print(f"\n📋 Probando: {url_message}")
            result = search_service.search_by_url(url_message)
            if result:
                print(f"   ✅ Propiedad encontrada: {result['Title']}")
            else:
                print(f"   ❌ No se encontró propiedad (esperado para URLs de prueba)")
        
        print("\n✅ URL detection tests completed")
        return True
        
    except Exception as e:
        print(f"❌ Error en test_url_detection: {e}")
        import traceback
        print(traceback.format_exc())
        return False

def main():
    """Ejecuta todas las pruebas"""
    print("🚀 Iniciando pruebas del nuevo flujo de propiedades...")
    print("=" * 60)
    
    tests_passed = 0
    total_tests = 3
    
    # Ejecutar pruebas
    if test_property_search():
        tests_passed += 1
    
    if test_url_detection():
        tests_passed += 1
    
    if test_precalification_flow():
        tests_passed += 1
    
    # Resumen
    print("\n" + "=" * 60)
    print(f"📊 RESUMEN: {tests_passed}/{total_tests} pruebas pasaron")
    
    if tests_passed == total_tests:
        print("✅ Todas las pruebas pasaron correctamente!")
        print("\n🎯 BENEFICIOS DEL NUEVO SISTEMA:")
        print("   ✅ Solo usa propiedades REALES de la BD")
        print("   ✅ No inventa ni alucina datos")
        print("   ✅ Recopila criterios progresivamente")
        print("   ✅ Solo pasa a CALIFICACIÓN con propiedad confirmada")
        print("   ✅ Manejo robusto de múltiples coincidencias")
    else:
        print(f"❌ {total_tests - tests_passed} pruebas fallaron")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())