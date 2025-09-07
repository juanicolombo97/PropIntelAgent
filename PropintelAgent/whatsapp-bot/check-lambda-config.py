#!/usr/bin/env python3

"""
Script para verificar la configuración de variables de entorno en Lambda
"""

import subprocess
import json
import sys

def check_lambda_env():
    """Verifica las variables de entorno configuradas en Lambda"""
    
    try:
        print("🔍 Verificando configuración de Lambda...")
        
        # Obtener configuración actual
        result = subprocess.run([
            'aws', 'lambda', 'get-function-configuration',
            '--function-name', 'whatsapp-bot-api',
            '--query', 'Environment.Variables'
        ], capture_output=True, text=True, check=True)
        
        env_vars = json.loads(result.stdout)
        
        # Variables requeridas según el código
        required_vars = {
            'OPENAI_API_KEY': 'Clave API de OpenAI',
            'OPENAI_MODEL': 'Modelo de OpenAI (ej: gpt-4o-mini)', 
            'LEADS_TABLE': 'Tabla DynamoDB de leads',
            'MESSAGES_TABLE': 'Tabla DynamoDB de mensajes',
            'PROPERTIES_TABLE': 'Tabla DynamoDB de propiedades',
            'VISITS_TABLE': 'Tabla DynamoDB de visitas',
            'ADMIN_API_KEY': 'Clave API del admin'
        }
        
        # Variables opcionales
        optional_vars = {
            'AWS_REGION': 'Región AWS (por defecto: us-east-2)',
            'ADMIN_USERNAME': 'Usuario admin',
            'ADMIN_PASSWORD': 'Contraseña admin',
            'ADMIN_EMAIL': 'Email admin'
        }
        
        print("\n📋 VARIABLES REQUERIDAS:")
        missing_required = []
        
        for var, description in required_vars.items():
            if var in env_vars and env_vars[var]:
                if var == 'OPENAI_API_KEY':
                    print(f"   ✅ {var}: {env_vars[var][:8]}... ({description})")
                else:
                    print(f"   ✅ {var}: {env_vars[var]} ({description})")
            else:
                print(f"   ❌ {var}: NO CONFIGURADA ({description})")
                missing_required.append(var)
        
        print("\n📋 VARIABLES OPCIONALES:")
        for var, description in optional_vars.items():
            if var in env_vars and env_vars[var]:
                print(f"   ✅ {var}: {env_vars[var]} ({description})")
            else:
                print(f"   ⚪ {var}: No configurada ({description})")
        
        # Diagnóstico
        print("\n🔧 DIAGNÓSTICO:")
        if missing_required:
            print(f"   ❌ Faltan {len(missing_required)} variables requeridas:")
            for var in missing_required:
                print(f"      - {var}")
            print("\n💡 SOLUCIÓN:")
            print("   1. Configura las variables faltantes en AWS Lambda Console")
            print("   2. O usa el script: ./update-lambda-env.sh")
        else:
            print("   ✅ Todas las variables requeridas están configuradas")
            
            # Verificar OpenAI específicamente
            if env_vars.get('OPENAI_API_KEY'):
                if env_vars['OPENAI_API_KEY'].startswith('sk-'):
                    print("   ✅ OPENAI_API_KEY tiene formato correcto")
                else:
                    print("   ⚠️ OPENAI_API_KEY no parece tener formato correcto (debería empezar con 'sk-')")
        
        return len(missing_required) == 0
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error ejecutando AWS CLI: {e}")
        print("   Verifica que AWS CLI esté configurado y tengas permisos")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ Error parseando respuesta AWS: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    success = check_lambda_env()
    sys.exit(0 if success else 1)