# Patrones de Código

## Arquitectura en Capas

La aplicación sigue una arquitectura en capas bien definida:

### 1. Capa de Presentación

- **Componentes de UI**: Interfaz visual con la que interactúa el usuario
- **Páginas**: Rutas definidas en el App Router
- **Layouts**: Estructuras compartidas que envuelven múltiples páginas

### 2. Capa de Lógica de Negocio

- **Server Actions**: Funciones que ejecutan lógica del lado del servidor
- **Hooks personalizados**: Lógica de estado y efectos reutilizables
- **Proveedores de contexto**: Gestión de estado global

### 3. Capa de Datos

- **API Routes**: Endpoints que sirven datos
- **Modelos de datos**: Esquemas y tipos para entidades
- **Adaptadores de bases de datos**: Acceso a Postgres mediante Drizzle ORM

## Patrones de Componentes

### Componentes Client vs Server

- **Server Components**: Componentes renderizados en el servidor (predeterminado)
  ```tsx
  // Ejemplo de Server Component
  export default function ChatLayout({ children }) {
    return <div className="chat-layout">{children}</div>;
  }
  ```
- **Client Components**: Componentes con interactividad del cliente ('use client')

  ```tsx
  "use client";

  import { useState } from "react";

  export function Counter() {
    const [count, setCount] = useState(0);
    return <button onClick={() => setCount(count + 1)}>{count}</button>;
  }
  ```

### Patrón de Composición

- Componentes pequeños y especializados que se componen para formar UI más complejas

  ```tsx
  // Ejemplo de composición
  function ChatMessage({ message }) {
    /*...*/
  }
  function ChatInput({ onSend }) {
    /*...*/
  }

  function ChatInterface() {
    return (
      <div>
        <ChatMessageList messages={messages} />
        <ChatInput onSend={handleSend} />
      </div>
    );
  }
  ```

### Patrón de Formularios

- Uso de Server Actions para procesamiento de formulario
  ```tsx
  // Ejemplo de form con action
  export default function LoginForm() {
    return (
      <form action={handleLogin}>
        <input name="email" type="email" required />
        <input name="password" type="password" required />
        <SubmitButton>Login</SubmitButton>
      </form>
    );
  }
  ```

## Ejemplos de Implementación

### Autenticación (Page + Server Action)

```tsx
// app/(auth)/login/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { AuthForm } from "@/components/auth-form";
import { login } from "../actions";

export default function Page() {
  const [state, formAction] = useActionState(login, { status: "idle" });
  // ...
}
```

```tsx
// app/(auth)/actions.ts
"use server";

import { z } from "zod";
import { signIn } from "next-auth/react";

export async function login(formData: FormData) {
  // Validación, autenticación, etc.
}
```

### Componente de UI Reutilizable

```tsx
// components/submit-button.tsx
"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  isSuccessful = false,
}: {
  children: React.ReactNode;
  isSuccessful?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || isSuccessful}
      className="button-primary"
    >
      {pending ? "Cargando..." : isSuccessful ? "¡Listo!" : children}
    </button>
  );
}
```

## Recomendaciones y Mejores Prácticas

### Tipado con TypeScript

- Usar tipos/interfaces para todas las props de componentes
- Definir tipos para respuestas de API y datos
- Utilizar zod para validación de esquemas

### Gestión de Estado

- Preferir Server Components cuando sea posible
- Usar hooks de React para estado local
- Implementar Context API para estado compartido entre componentes

### Manejo de Errores

- Implementar error boundaries en componentes críticos
- Proporcionar estados fallback/loading en componentes
- Validar entradas de usuario tanto en cliente como en servidor

### Accesibilidad

- Usar componentes de Radix UI como base accesible
- Asegurar contraste adecuado con Tailwind
- Implementar atributos ARIA cuando sea necesario
