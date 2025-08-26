#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 Generador de Secretos para Panel Inmobiliario');
console.log('===============================================\n');

// Generar JWT Secret
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_SECRET (copia esto a tu .env.local):');
console.log(`JWT_SECRET=${jwtSecret}\n`);

// Generar API Key
const apiKey = crypto.randomBytes(16).toString('hex').toUpperCase();
console.log('ADMIN_API_KEY (copia esto a tu .env.local):');
console.log(`ADMIN_API_KEY=${apiKey}\n`);

// Ejemplo de contraseña segura
const passwordChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
let password = '';
for (let i = 0; i < 16; i++) {
  password += passwordChars.charAt(Math.floor(Math.random() * passwordChars.length));
}

console.log('Contraseña de ejemplo (cámbiala por una tuya):');
console.log(`ADMIN_PASSWORD=${password}\n`);

console.log('💡 Archivo .env.local de ejemplo:');
console.log('==================================');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('ADMIN_USERNAME=admin');
console.log(`ADMIN_PASSWORD=${password}`);
console.log('WHATSAPP_API_URL=http://localhost:8000');
console.log(`ADMIN_API_KEY=${apiKey}`);
console.log('\n⚠️  IMPORTANTE: Guarda estos valores de forma segura!');