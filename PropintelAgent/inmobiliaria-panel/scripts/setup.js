#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Configurando Panel Inmobiliario...\n');

// Generar secretos
const jwtSecret = crypto.randomBytes(32).toString('hex');
const apiKey = crypto.randomBytes(16).toString('hex').toUpperCase();

// Crear archivo .env.local si no existe
const envPath = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(envPath)) {
  console.log('⚠️  El archivo .env.local ya existe. No se sobrescribirá.');
  console.log('   Si quieres recrearlo, elimínalo primero:\n');
  console.log('   rm .env.local\n');
  return;
}

const envContent = `# Variables de entorno para el panel inmobiliario
# Generado automáticamente - NO COMPARTIR ESTOS VALORES

# Secreto para JWT (generado automáticamente)
JWT_SECRET=${jwtSecret}

# === CONFIGURACIÓN DE AUTENTICACIÓN ===

# Credenciales del administrador principal (cámbialas por las tuyas)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@propintel.com

# === USUARIOS ADICIONALES (Opcional) ===
# Descomenta y configura usuarios adicionales si es necesario:
# USER_JUAN_PASSWORD=password123
# USER_JUAN_EMAIL=juan@propintel.com
# USER_JUAN_ROLE=user

# === CONFIGURACIÓN DE API ===

# URL del API del bot de WhatsApp/Lambda
WHATSAPP_API_URL=http://localhost:8000
# Para AWS Lambda, cambiar por tu URL de Lambda:
# WHATSAPP_API_URL=https://tu-lambda-url.execute-api.region.amazonaws.com/prod

# API Key para conectar con el backend (generada automáticamente)
ADMIN_API_KEY=${apiKey}

# === CONFIGURACIÓN PARA PRODUCCIÓN ===
# NODE_ENV=production
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Archivo .env.local creado exitosamente!');
  console.log('\n🔐 Credenciales generadas:');
  console.log('   Usuario: admin');
  console.log('   Contraseña: admin123');
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   1. Cambia la contraseña por defecto en .env.local');
  console.log('   2. Nunca compartas este archivo en repositorios públicos');
  console.log('   3. Para producción, usa contraseñas más seguras\n');
  console.log('🚀 ¡Listo! Ahora puedes ejecutar: npm run dev');
} catch (error) {
  console.error('❌ Error creando .env.local:', error.message);
  process.exit(1);
}