// Configuración de API keys y URLs
export const API_CONFIG = {
  // Clave API para autenticación con el bot de WhatsApp
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || 'b3abf8b65ca122d771ebfa52cc87e191e826d0694bd586c16f28a723bf2bafba',
  
  // URL del bot de WhatsApp (local para desarrollo)
  BOT_WEBHOOK_URL: process.env.BOT_WEBHOOK_URL || 'http://localhost:8000',
  
  // URL de la API de Lambda (para producción)
  LAMBDA_API_URL: 'https://rmys43m4av7y4kptnnvacfsmu40olhvq.lambda-url.us-east-2.on.aws',
  
  // Configuración JWT
  JWT_SECRET: process.env.JWT_SECRET || ''
}; 