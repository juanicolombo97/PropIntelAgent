# Panel Inmobiliaria - Frontend Mejorado

Panel de administración moderno y fácil de usar para gestionar leads y propiedades inmobiliarias.

## 🚀 Características

### ✨ Mejoras Implementadas

- **Componentes Reutilizables**: Sistema de componentes UI modular y consistente
- **TypeScript**: Tipado fuerte para mejor seguridad y desarrollo
- **Diseño Responsivo**: Interfaz optimizada para desktop y móvil
- **UX Mejorada**: Navegación intuitiva y feedback visual
- **Manejo de Errores**: Gestión robusta de errores y estados de carga
- **Accesibilidad**: Componentes accesibles y semánticamente correctos

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

## 📁 Estructura del Proyecto

```
inmobiliaria-panel/
├── app/                    # Páginas de la aplicación
│   ├── leads/             # Gestión de leads
│   ├── properties/        # Gestión de propiedades
│   └── layout.tsx         # Layout principal
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes base (Button, Input, etc.)
│   ├── leads/            # Componentes específicos de leads
│   └── properties/       # Componentes específicos de propiedades
├── lib/                  # Utilidades y configuración
│   ├── api.ts           # Cliente API tipado
│   ├── types.ts         # Definiciones de tipos
│   └── utils.ts         # Funciones utilitarias
└── README.md            # Documentación
```

## 🚀 Instalación y Uso

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**:
   ```bash
   NEXT_PUBLIC_API_BASE=http://localhost:8000
   ```

3. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

4. **Construir para producción**:
   ```bash
   npm run build
   npm start
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

## 🔄 Flujo de Trabajo

1. **Dashboard**: Vista general con métricas y acciones rápidas
2. **Leads**: Gestión de leads con filtros por estado
3. **Propiedades**: CRUD de propiedades con filtros por barrio
4. **Detalle de Lead**: Vista completa con perfil, mensajes y visitas

## 🎨 Paleta de Colores

- **Primario**: Azul (#2563eb)
- **Éxito**: Verde (#16a34a)
- **Advertencia**: Amarillo (#ca8a04)
- **Error**: Rojo (#dc2626)
- **Neutral**: Gris (#6b7280)

## 📈 Próximas Mejoras

- [ ] Gráficos y estadísticas avanzadas
- [ ] Notificaciones en tiempo real
- [ ] Exportación de datos
- [ ] Búsqueda global
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
