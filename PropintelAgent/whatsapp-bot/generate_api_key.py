#!/usr/bin/env python3
"""
Script para generar una API key para el panel administrativo
"""
import secrets
import string

def generate_api_key(length=32):
    """Genera una API key segura"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

if __name__ == "__main__":
    api_key = generate_api_key()
    print("=" * 50)
    print("API KEY GENERADA PARA EL PANEL ADMINISTRATIVO")
    print("=" * 50)
    print(f"API Key: {api_key}")
    print("=" * 50)
    print("\nINSTRUCCIONES:")
    print("1. Copia esta API key")
    print("2. Añádela como variable de entorno ADMIN_API_KEY en tu Lambda")
    print("3. Añádela como variable de entorno NEXT_PUBLIC_ADMIN_API_KEY en tu frontend")
    print("\nEjemplo para .env.local del frontend:")
    print(f"NEXT_PUBLIC_ADMIN_API_KEY={api_key}")
    print("=" * 50) 