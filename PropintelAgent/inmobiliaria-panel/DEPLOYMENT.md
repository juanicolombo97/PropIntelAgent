# 🚀 Guía de Despliegue - Panel Inmobiliario

Esta guía te llevará paso a paso para hacer público tu panel inmobiliario de forma segura.

## 📋 Requisitos Previos

- [ ] Cuenta de GitHub
- [ ] Cuenta de Vercel (gratuita)
- [ ] WhatsApp Bot funcionando y desplegado
- [ ] **NUEVO**: AWS Lambda con el backend desplegado (recomendado para producción)

## 🔧 Preparación

### 1. Preparar el Repositorio

```bash
# 1. Crear un repositorio nuevo en GitHub
# 2. Clonar tu proyecto actual
git clone <tu-repositorio>
cd <tu-repositorio>

# 3. Instalar dependencias
npm install

# 4. Configurar entorno local
npm run setup
```

### 2. Configurar Backend

**Opción A: AWS Lambda (Recomendado para producción)**
```bash
# Ver guía detallada de AWS Lambda
cat AWS_LAMBDA_SETUP.md
```

**Opción B: Servidor Propio**
```bash
# Configurar tu servidor con el bot de WhatsApp
# Asegúrate de que esté accesible públicamente
```

### 3. Generar Credenciales Seguras

```bash
# Generar nuevos secretos para producción
npm run generate-secrets

# Guardar los valores generados - los necesitarás en Vercel
```

**⚠️ IMPORTANTE**: 
- Usa credenciales diferentes a las de desarrollo
- Si usas AWS Lambda, configura las mismas credenciales en ambos lugares

## 🌐 Despliegue en Vercel

### Paso 1: Conectar Repositorio

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "New Project"
3. Conecta tu cuenta de GitHub
4. Selecciona tu repositorio
5. Configura el directorio raíz como `inmobiliaria-panel`

### Paso 2: Configurar Variables de Entorno

En la configuración de Vercel, agrega estas variables:

```bash
# Variables de Autenticación (OBLIGATORIAS)
JWT_SECRET=tu-secreto-jwt-super-seguro-de-64-caracteres
ADMIN_USERNAME=tu-usuario-admin
ADMIN_PASSWORD=tu-contraseña-super-segura
ADMIN_EMAIL=admin@tu-dominio.com

# Conexión con Backend (OBLIGATORIAS)
# Para AWS Lambda:
WHATSAPP_API_URL=https://tu-lambda-id.execute-api.region.amazonaws.com/prod
# Para servidor propio:
# WHATSAPP_API_URL=https://tu-bot-whatsapp.herokuapp.com

ADMIN_API_KEY=tu-api-key-del-backend

# Variables de Next.js (AUTOMÁTICAS)
NODE_ENV=production
```

### Paso 3: Configurar el Backend

**Para AWS Lambda:**
1. **Sigue la guía** `AWS_LAMBDA_SETUP.md`
2. **Configura las mismas variables** en Lambda que en Vercel
3. **Verifica los permisos** de DynamoDB

**Para servidor propio:**
1. **Esté desplegado** en Heroku, Railway, o similar
2. **Tenga CORS configurado** para tu dominio de Vercel
3. **Use la misma ADMIN_API_KEY** que configuraste en Vercel

#### Configurar CORS en el Bot

En tu `whatsapp-bot/app.py`, agrega:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tu-panel.vercel.app",  # Tu dominio de Vercel
        "http://localhost:3000"         # Para desarrollo
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Paso 4: Desplegar

1. Haz clic en "Deploy" en Vercel
2. Espera a que termine el build
3. ¡Tu aplicación estará disponible en `https://tu-app.vercel.app`!

## 🔒 Seguridad en Producción

### Credenciales Fuertes

```bash
# Usuario único (no uses "admin")
ADMIN_USERNAME=tu_usuario_unico_2024

# Contraseña compleja (mínimo 16 caracteres)
ADMIN_PASSWORD=MiContraseñaSuperSegura123!@#

# JWT Secret largo (64+ caracteres)
JWT_SECRET=un-secreto-muy-largo-y-aleatorio-que-nunca-adivinen...
```

### Lista de Verificación de Seguridad

- [ ] ✅ Contraseña fuerte (16+ caracteres, números, símbolos)
- [ ] ✅ Usuario único (no "admin")
- [ ] ✅ JWT_SECRET único y largo
- [ ] ✅ ADMIN_API_KEY coincide con el bot
- [ ] ✅ WHATSAPP_API_URL usa HTTPS
- [ ] ✅ Variables de entorno configuradas en Vercel
- [ ] ✅ .env.local NO está en el repositorio

## 🔧 Configuración de Dominio Personalizado

### En Vercel (Opcional)

1. Ve a tu proyecto en Vercel
2. Settings → Domains
3. Agrega tu dominio personalizado
4. Configura los DNS según las instrucciones

### Actualizar CORS del Bot

Agrega tu dominio personalizado al CORS:

```python
allow_origins=[
    "https://tu-dominio.com",
    "https://tu-panel.vercel.app",
    "http://localhost:3000"
]
```

## 🚨 Solución de Problemas

### Error: "API key inválida"

**Causa**: ADMIN_API_KEY no coincide entre el panel y el bot.

**Solución**:
1. Verifica que ambos usen la misma API key
2. Regenera la API key en ambos lugares
3. Redespliega ambas aplicaciones

### Error: "CORS policy"

**Causa**: El bot no permite requests desde tu dominio.

**Solución**:
1. Agrega tu dominio al CORS del bot
2. Redespliega el bot
3. Verifica que la URL del bot sea correcta

### Error: "Login failed"

**Causa**: Credenciales incorrectas o JWT_SECRET inválido.

**Solución**:
1. Verifica las credenciales en Vercel
2. Regenera JWT_SECRET si es necesario
3. Redespliega la aplicación

### Error: "Failed to fetch"

**Causa**: WHATSAPP_API_URL incorrecta o bot no disponible.

**Solución**:
1. Verifica que la URL del bot esté correcta
2. Comprueba que el bot esté funcionando
3. Verifica que use HTTPS en producción

## 📊 Monitoreo

### Logs en Vercel

1. Ve a tu proyecto en Vercel
2. Functions → View Function Logs
3. Revisa errores de autenticación o API

### Verificar Funcionamiento

1. **Login**: `https://tu-app.vercel.app/login`
2. **API Health**: `https://tu-bot.herokuapp.com/` (debe responder OK)
3. **Panel Admin**: Prueba crear leads y propiedades

## 🔄 Actualizaciones

Para actualizar tu aplicación:

```bash
# 1. Hacer cambios en tu código local
# 2. Commit y push a GitHub
git add .
git commit -m "Actualización del panel"
git push origin main

# 3. Vercel redesplegará automáticamente
```

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs** en Vercel
2. **Verifica las variables** de entorno
3. **Comprueba el estado** del WhatsApp Bot
4. **Prueba en local** primero

---

¡Felicidades! 🎉 Tu panel inmobiliario ahora está público y seguro.