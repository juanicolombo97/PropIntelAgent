# ⚡ Setup Rápido AWS - 3 Comandos

Si quieres tener tu panel funcionando en producción con AWS en minutos, sigue estos 3 pasos:

## 🚀 Paso 1: Configurar AWS CLI

```bash
# Instalar AWS CLI (si no lo tienes)
# macOS:
brew install awscli

# Configurar credenciales (necesitas una cuenta AWS)
aws configure
# AWS Access Key ID: [tu-access-key de AWS]
# AWS Secret Access Key: [tu-secret-key de AWS] 
# Default region: us-east-1
# Default output format: json
```

> 💡 **¿No tienes credenciales de AWS?** 
> 1. Ve a [AWS Console](https://aws.amazon.com/console/)
> 2. IAM → Users → Create User
> 3. Attach policies: `AdministratorAccess` (para simplificar)
> 4. Create access key → CLI
> 5. Copia las credenciales

## ⚡ Paso 2: Configurar AWS Automáticamente

```bash
# Ejecutar script automático
npm run setup-aws
```

Este comando:
- ✅ Crea todas las tablas DynamoDB
- ✅ Configura Lambda con tu bot
- ✅ Crea API Gateway público
- ✅ Genera credenciales seguras
- ✅ Te da la URL final

## 🌐 Paso 3: Configurar y Desplegar Frontend

```bash
# Configurar frontend automáticamente
npm run configure-production

# Cuando te pregunte por la URL del backend, 
# usa la que te dio el paso anterior:
# https://tu-api-id.execute-api.us-east-1.amazonaws.com/prod
```

Luego:
1. Sube tu código a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Conecta tu repositorio
4. Configura las variables de `.env.production`
5. ¡Despliega!

## ✅ Resultado Final

Tendrás:
- 🌐 **API Backend en AWS**: `https://tu-api-id.execute-api.us-east-1.amazonaws.com/prod`
- 🖥️ **Panel Frontend en Vercel**: `https://tu-app.vercel.app`
- 🔐 **Login seguro** con credenciales únicas
- 📊 **Base de datos** en DynamoDB
- 💰 **Costo mínimo** (AWS Free Tier para empezar)

## 🆘 Si algo falla

### Error: "AWS CLI not configured"
```bash
aws configure
```

### Error: "No permissions"
Verifica que tu usuario AWS tenga permisos de:
- DynamoDB
- Lambda 
- API Gateway
- IAM

### Ver logs detallados
```bash
# Ver logs de Lambda
aws logs filter-log-events --log-group-name /aws/lambda/whatsapp-bot-api

# Probar API manualmente
curl https://tu-api-id.execute-api.us-east-1.amazonaws.com/prod/
```

## 📄 Archivos Importantes

Después del setup tendrás:
- `aws-config.env` - Configuración de AWS
- `.env.production` - Variables para Vercel
- `AWS_SETUP_STEP_BY_STEP.md` - Guía detallada paso a paso

---

**¿Prefieres hacerlo manualmente?** Ver `AWS_SETUP_STEP_BY_STEP.md` para el proceso completo paso a paso.