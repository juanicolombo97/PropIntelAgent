#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

console.log('🚀 Configurador de Producción - Panel Inmobiliario\n');
console.log('Este script te ayudará a configurar el panel para producción.\n');

async function main() {
  try {
    // Determinar tipo de backend
    console.log('📡 ¿Qué tipo de backend vas a usar?');
    console.log('1. AWS Lambda (Recomendado para producción)');
    console.log('2. Servidor propio (Heroku, VPS, etc.)');
    const backendType = await question('\nElige una opción (1 o 2): ');

    // Generar secretos
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    const apiKey = crypto.randomBytes(16).toString('hex').toUpperCase();

    console.log('\n🔐 Configuración de Autenticación:');
    const adminUsername = await question('Usuario administrador (admin): ') || 'admin';
    const adminPassword = await question('Contraseña administrador (debe ser segura): ');
    const adminEmail = await question('Email administrador: ');

    // Configurar URL del backend
    let apiUrl;
    if (backendType === '1') {
      console.log('\n🌐 Configuración AWS Lambda:');
      const lambdaRegion = await question('Región de AWS (us-east-1): ') || 'us-east-1';
      const lambdaId = await question('ID de tu función Lambda: ');
      apiUrl = `https://${lambdaId}.execute-api.${lambdaRegion}.amazonaws.com/prod`;
    } else {
      console.log('\n🌐 Configuración de Servidor:');
      apiUrl = await question('URL de tu servidor (ej: https://mi-bot.herokuapp.com): ');
    }

    // Crear archivo .env.production
    const envPath = path.join(__dirname, '..', '.env.production');
    const envContent = `# Variables de entorno para PRODUCCIÓN
# Generado automáticamente - NO COMPARTIR ESTOS VALORES

# === CONFIGURACIÓN JWT ===
JWT_SECRET=${jwtSecret}

# === AUTENTICACIÓN ===
ADMIN_USERNAME=${adminUsername}
ADMIN_PASSWORD=${adminPassword}
ADMIN_EMAIL=${adminEmail}

# === CONFIGURACIÓN DE API ===
WHATSAPP_API_URL=${apiUrl}
ADMIN_API_KEY=${apiKey}

# === PRODUCCIÓN ===
NODE_ENV=production
`;

    fs.writeFileSync(envPath, envContent);

    // Mostrar resumen
    console.log('\n✅ Configuración completada!\n');
    console.log('📁 Archivo creado: .env.production\n');
    
    console.log('🔑 Variables generadas:');
    console.log(`   JWT_SECRET: ${jwtSecret}`);
    console.log(`   ADMIN_API_KEY: ${apiKey}`);
    console.log(`   Usuario: ${adminUsername}`);
    console.log(`   Email: ${adminEmail}\n`);

    if (backendType === '1') {
      console.log('📋 PRÓXIMOS PASOS PARA AWS LAMBDA:');
      console.log('1. Configurar las mismas variables en tu función Lambda');
      console.log('2. Verificar permisos de DynamoDB');
      console.log('3. Ver guía completa: AWS_LAMBDA_SETUP.md\n');
    } else {
      console.log('📋 PRÓXIMOS PASOS PARA SERVIDOR PROPIO:');
      console.log('1. Configurar las mismas variables en tu servidor');
      console.log('2. Asegurar que CORS esté configurado');
      console.log('3. Verificar que el servidor esté accesible públicamente\n');
    }

    console.log('🚀 PARA VERCEL:');
    console.log('1. Copia las variables de .env.production');
    console.log('2. Configúralas en el dashboard de Vercel');
    console.log('3. Despliega tu aplicación');
    console.log('4. Ver guía completa: DEPLOYMENT.md\n');

    console.log('⚠️  IMPORTANTE:');
    console.log('   - Nunca compartas el archivo .env.production');
    console.log('   - Usa las mismas credenciales en backend y frontend');
    console.log('   - Cambia las contraseñas por defecto\n');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
  } finally {
    rl.close();
  }
}

main();