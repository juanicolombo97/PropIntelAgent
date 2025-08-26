# Panel Inmobiliaria - Frontend Mejorado

Panel de administración moderno y fácil de usar para gestionar leads y propiedades inmobiliarias.

## 🚀 Características

### ✨ Mejoras Implementadas

- **🔐 Sistema de Autenticación**: Login seguro con JWT y protección de rutas
- **Componentes Reutilizables**: Sistema de componentes UI modular y consistente
- **TypeScript**: Tipado fuerte para mejor seguridad y desarrollo
- **Diseño Responsivo**: Interfaz optimizada para desktop y móvil
- **UX Mejorada**: Navegación intuitiva y feedback visual
- **Manejo de Errores**: Gestión robusta de errores y estados de carga
- **Accesibilidad**: Componentes accesibles y semánticamente correctos
- **🚀 Listo para Producción**: Configurado para despliegue público

### 🎨 Componentes UI

- **Button**: Botones con múltiples variantes y estados
- **Input**: Campos de entrada con validación y labels
- **Card**: Contenedores para organizar contenido
- **Table**: Tablas responsivas con ordenamiento
- **Badge**: Etiquetas para estados y categorías

### 📊 Funcionalidades

- **Dashboard**: Vista general con estadísticas y acciones rápidas
- **Gestión de Leads**: Lista, filtrado y detalles de leads
- **Gestión de Propiedades**: CRUD completo de propiedades
- **Filtros Avanzados**: Búsqueda y filtrado por barrio
- **Formularios Intuitivos**: Creación y edición de datos

## 🛠️ Tecnologías

- **Next.js 15**: Framework React con App Router
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Framework de estilos utilitarios
- **Lucide React**: Iconografía moderna
- **React Server Components**: Renderizado optimizado
- **JWT**: Autenticación segura con tokens
- **bcryptjs**: Hashing seguro de contraseñas
- **Middleware**: Protección de rutas automática

## 📁 Estructura del Proyecto

```
inmobiliaria-panel/
├── app/                    # Páginas de la aplicación
│   ├── api/auth/          # Rutas de autenticación
│   ├── login/             # Página de login
│   ├── leads/             # Gestión de leads
│   ├── properties/        # Gestión de propiedades
│   └── layout.tsx         # Layout principal
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes base (Button, Input, etc.)
│   ├── leads/            # Componentes específicos de leads
│   └── properties/       # Componentes específicos de propiedades
├── lib/                  # Utilidades y configuración
│   ├── api.ts           # Cliente API tipado
│   ├── auth.ts          # Utilidades de autenticación
│   ├── useAuth.ts       # Hook de autenticación
│   ├── types.ts         # Definiciones de tipos
│   └── utils.ts         # Funciones utilitarias
├── middleware.ts         # Middleware de protección de rutas
├── vercel.json          # Configuración de despliegue
├── env.example          # Variables de entorno de ejemplo
└── README.md            # Documentación
```

## 🚀 Instalación y Uso

### 🔧 Desarrollo Local

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar automáticamente** (recomendado):
   ```bash
   npm run setup
   ```

   O **configurar manualmente**:
   ```bash
   # Generar secretos seguros automáticamente
   npm run generate-secrets
   
   # Copiar el archivo de ejemplo
   cp env.example .env.local
   
   # Pegar los secretos generados en .env.local y ajustar otros valores
   ```

3. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

4. **Acceder a la aplicación**:
   - URL: `http://localhost:3000`
   - Usuario: `admin` (o el configurado en ADMIN_USERNAME)
   - Contraseña: `admin123` (o la configurada en ADMIN_PASSWORD)

### 🚀 Despliegue en Producción

#### 🚀 Opción 1: Setup Rápido AWS (Recomendado)
```bash
# Solo 3 comandos para tener todo funcionando
npm run setup-aws
npm run configure-production
# Luego desplegar en Vercel
```
📄 **Ver guía completa**: [SETUP_RAPIDO_AWS.md](SETUP_RAPIDO_AWS.md)

#### 🔧 Opción 2: Configuración Manual AWS
```bash
# Si prefieres control total sobre cada paso
# Ver guía paso a paso
```
📄 **Ver guía detallada**: [AWS_SETUP_STEP_BY_STEP.md](AWS_SETUP_STEP_BY_STEP.md)

#### 🌐 Opción 3: Vercel Manual

1. **Fork el repositorio** en GitHub

2. **Conectar con Vercel**:
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu cuenta de GitHub
   - Selecciona el repositorio forkeado
   - Selecciona la carpeta `inmobiliaria-panel`

3. **Configurar variables de entorno en Vercel**:
   ```bash
   JWT_SECRET=tu-secreto-jwt-super-seguro-64-caracteres
   ADMIN_USERNAME=tu-usuario-admin
   ADMIN_PASSWORD=tu-contraseña-super-segura
   ADMIN_EMAIL=admin@tu-dominio.com
   WHATSAPP_API_URL=https://tu-lambda-url.execute-api.region.amazonaws.com/prod
   ADMIN_API_KEY=tu-api-key-super-secreta
   ```

4. **Desplegar**:
   - Vercel desplegará automáticamente
   - Tu aplicación estará disponible en `https://tu-app.vercel.app`

📋 **Ver guía completa**: `DEPLOYMENT.md`

### 🔒 Seguridad en Producción

⚠️ **IMPORTANTE**: Cambia las credenciales por defecto antes de hacer público:

```bash
# Genera un JWT_SECRET seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Usa credenciales fuertes
ADMIN_USERNAME=tu-usuario-seguro
ADMIN_PASSWORD=contraseña-muy-segura-123!@#
```

## 🎯 Buenas Prácticas Implementadas

### 🏗️ Arquitectura
- **Separación de Responsabilidades**: Componentes, servicios y utilidades separados
- **Composición de Componentes**: Reutilización máxima de código
- **Props Tipadas**: Interfaces TypeScript para todos los componentes

### 🎨 Diseño
- **Sistema de Diseño Consistente**: Colores, espaciado y tipografía unificados
- **Componentes Atómicos**: Botones, inputs y cards reutilizables
- **Responsive First**: Diseño móvil primero

### 🔧 Desarrollo
- **TypeScript Strict**: Configuración estricta para mejor calidad de código
- **Error Boundaries**: Manejo robusto de errores
- **Loading States**: Estados de carga para mejor UX
- **Formularios Optimizados**: Validación y feedback en tiempo real

### 📱 UX/UI
- **Navegación Intuitiva**: Menú claro y accesible
- **Feedback Visual**: Estados de hover, focus y loading
- **Accesibilidad**: ARIA labels y navegación por teclado
- **Iconografía**: Iconos consistentes con Lucide React

### 🔐 Autenticación y Seguridad
- **JWT Tokens**: Autenticación segura con tokens firmados
- **Middleware de Protección**: Todas las rutas protegidas automáticamente
- **Cookies Seguras**: Almacenamiento seguro de tokens
- **Hash de Contraseñas**: bcryptjs para proteger credenciales
- **Variables de Entorno**: Configuración externa para secretos

## 🔄 Flujo de Trabajo

1. **Login**: Autenticación segura para acceder al panel
2. **Dashboard**: Vista general con métricas y acciones rápidas
3. **Leads**: Gestión de leads con filtros por estado
4. **Propiedades**: CRUD de propiedades con filtros por barrio
5. **Detalle de Lead**: Vista completa con perfil, mensajes y visitas
6. **Logout**: Cierre de sesión seguro

## 🎨 Paleta de Colores

- **Primario**: Azul (#2563eb)
- **Éxito**: Verde (#16a34a)
- **Advertencia**: Amarillo (#ca8a04)
- **Error**: Rojo (#dc2626)
- **Neutral**: Gris (#6b7280)

## 📈 Próximas Mejoras

- [x] 🔐 Sistema de autenticación completo
- [x] 🚀 Configuración para despliegue público
- [ ] Gráficos y estadísticas avanzadas
- [ ] Notificaciones en tiempo real
- [ ] Exportación de datos
- [ ] Búsqueda global
- [ ] Gestión de usuarios múltiples
- [ ] Roles y permisos
- [ ] Temas personalizables
- [ ] Modo oscuro

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
