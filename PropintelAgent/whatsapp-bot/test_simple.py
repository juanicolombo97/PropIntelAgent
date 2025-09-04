#!/usr/bin/env python3
"""
Test simple del bot inmobiliario.
Simula exactamente lo que hace el webhook: recibe número y mensaje, devuelve respuesta.

Uso:
    python test_simple.py
"""

import sys
import os

# Agregar el directorio actual al path para importar módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routers.webhook import test_bot_message

def main():
    """Función principal - simula webhook"""

    
    phone_number = '0'
    message = 'No lo tengo'
    
    print(f"📱 Número: {phone_number}")
    print(f"💬 Mensaje: {message}")
    print("-" * 50)
    
    # Llamar al bot exactamente como lo hace el webhook
    response = test_bot_message(
        phone_number=phone_number,
        message=message,
        verbose=True  # Mostrar debug info
    )
    
    print(f"🤖 Respuesta: {response}")

if __name__ == "__main__":
    main()