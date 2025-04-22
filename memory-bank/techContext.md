# Contexto Técnico

## Tecnologías Utilizadas

### Frontend

- **Next.js 15**: Framework React con App Router para enrutamiento avanzado
- **React 19**: Biblioteca JS para construcción de interfaces
- **Tailwind CSS**: Framework CSS de utilidades para estilizado
- **shadcn/ui**: Componentes UI basados en Radix UI y Tailwind
- **TypeScript**: Superset de JavaScript tipado

### Backend

- **Next.js API Routes**: Para endpoints de API
- **Server Actions**: Para operaciones del lado del servidor
- **AI SDK**: Para integración con modelos de lenguaje
- **Auth.js (NextAuth 5.0)**: Para autenticación de usuarios con enlaces mágicos

### Base de Datos

- **Neon Serverless Postgres**: Base de datos PostgreSQL serverless
- **Drizzle ORM**: ORM para comunicación con la base de datos
- **Vercel Blob**: Para almacenamiento de archivos

### Modelos de IA

- **xAI (Grok)**: Modelo predeterminado
- **Soporte para OpenAI, Anthropic, Cohere**: A través de AI SDK

### Herramientas de Desarrollo

- **pnpm**: Gestor de paquetes
- **ESLint/Biome**: Linting y formateo de código
- **Playwright**: Para testing e2e

## Configuración del Entorno de Desarrollo

### Requisitos Previos

- Node.js 18+
- pnpm 9+
- Acceso a servicios de Vercel (opcional para despliegue)

### Variables de Entorno

La aplicación requiere variables de entorno definidas en `.env.local`:

- `AUTH_SECRET`: Secreto para Auth.js y tokens JWT
- `RESEND_API_KEY`: Para envío de enlaces mágicos de autenticación
- `EMAIL_FROM`: Dirección de correo para envío de enlaces
- `POSTGRES_URL`: Conexión a base de datos PostgreSQL
- `XAI_API_KEY`/`OPENAI_API_KEY`: Claves de API para modelos de IA
- `BLOB_READ_WRITE_TOKEN`: Para almacenamiento de archivos

### Comandos Principales

- `pnpm dev`: Inicia el servidor de desarrollo
- `pnpm build`: Construye la aplicación para producción
- `pnpm lint`: Ejecuta el linter
- `pnpm db:migrate`: Ejecuta migraciones de base de datos

## Restricciones Técnicas

### Compatibilidad

- Navegadores modernos con soporte para ES6+
- Requisitos de API de servidor para modelos de IA

### Seguridad

- Tokens de acceso para modelos de IA
- Secretos para autenticación
- JWT para sesiones de usuarios

### Rendimiento

- Optimizaciones de Next.js para Server Components
- Streaming para respuestas de IA en tiempo real

## Dependencias Principales

### Componentes UI

- `@radix-ui/*`: Primitivos de componentes
- `class-variance-authority`: Para estilos condicionales
- `lucide-react`: Iconos

### Funcionalidad

- `@ai-sdk/react`: React hooks para AI SDK
- `@ai-sdk/xai`: Integración con xAI
- `next-auth`: Autenticación (v5 beta)
- `@auth/drizzle-adapter`: Adaptador de Drizzle para Auth.js
- `resend`: Servicio de correo para envío de enlaces mágicos
- `drizzle-orm`: ORM para base de datos

### Utilidades

- `date-fns`: Manipulación de fechas
- `zod`: Validación de esquemas
- `nanoid`: Generación de IDs
- `dotenv`: Carga de variables de entorno
