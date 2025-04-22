# Patrones del Sistema

## Arquitectura General

La aplicación sigue una arquitectura basada en el App Router de Next.js, que proporciona una estructura organizada y eficiente:

```
app/
├── (auth)/              # Grupo de rutas de autenticación
│   ├── login/           # Ruta de inicio de sesión
│   ├── register/        # Ruta de registro
│   ├── actions.ts       # Server actions para autenticación
│   ├── auth.config.ts   # Configuración base de NextAuth
│   └── auth.ts          # Configuración de Auth.js con proveedores
├── (chat)/              # Grupo de rutas de chat
│   ├── chat/            # Interfaz principal de chat
│   ├── api/             # Endpoints de API para el chat
│   └── actions.ts       # Server actions para funcionalidad de chat
└── layout.tsx           # Layout principal de la aplicación
```

## Patrones de Diseño

### Server Components y Server Actions

- **Componentes del Servidor**: Los componentes principales están implementados como React Server Components para mejorar el rendimiento
- **Server Actions**: Las operaciones asíncronas como autenticación y comunicación con LLMs se implementan como Server Actions

### Patrón de Autenticación

- Implementación basada en Auth.js v5 (NextAuth) con estrategia JWT
- Flujo de autenticación passwordless mediante enlaces mágicos usando Resend
- Adaptador de Drizzle para almacenamiento de usuarios y sesiones
- Protección de rutas mediante middleware de autenticación
- Server Actions para manejar el flujo de inicio de sesión y registro
- Redirección a página de verificación durante el proceso de autenticación

### Patrón de Comunicación con IA

- Utilización de AI SDK para una interfaz unificada con diferentes proveedores de LLM
- Implementación de streaming para respuestas en tiempo real
- Gestión de contexto de conversación para mantener coherencia

## Relaciones entre Componentes

### Autenticación y Usuario

- Los componentes de autenticación manejan registro e inicio de sesión a través de server actions
- La sesión se almacena mediante JWT y se gestiona con callbacks personalizados
- La información de usuario (id, email) se propaga a componentes dependientes
- Las rutas protegidas verifican la existencia de un usuario autenticado

### Chat y Modelos de IA

- La interfaz de chat interactúa con AI SDK
- Los modelos de IA reciben el contexto de la conversación
- Las respuestas del modelo se transmiten de vuelta a la interfaz de usuario

### Persistencia de Datos

- Drizzle ORM maneja la comunicación con la base de datos Postgres
- Los historiales de chat se almacenan asociados a usuarios
- Operaciones CRUD implementadas mediante Server Actions

## Flujo de Datos

1. El usuario inicia el proceso de autenticación introduciendo su correo
2. Server actions validan el correo y envían un enlace mágico mediante Resend
3. El usuario accede al enlace y es autenticado automáticamente
4. La sesión JWT mantiene al usuario autenticado entre páginas
5. El usuario interactúa con la interfaz de chat
6. Los mensajes se envían a modelos de IA mediante AI SDK
7. Las respuestas se transmiten de vuelta y se almacenan en la base de datos
8. La interfaz de usuario se actualiza en tiempo real
