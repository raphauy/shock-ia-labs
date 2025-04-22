'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Componente interno que usa useSearchParams
function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errors: Record<string, string> = {
    Configuration: 'Hubo un problema con la configuración del servidor.',
    AccessDenied: 'No tienes permiso para acceder a esta página.',
    Verification:
      'El enlace de verificación ha expirado o ya ha sido utilizado.',
    Default: 'Se produjo un error durante la autenticación.',
  };

  const errorMessage = error && errors[error] ? errors[error] : errors.Default;

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <h3 className="text-xl font-semibold">Error de Autenticación</h3>
      <p className="text-sm text-gray-500 dark:text-zinc-400">{errorMessage}</p>
      <p className="text-xs text-gray-400">
        Código de error: {error || 'Desconocido'}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <Link
          href="/login"
          className="flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Volver al inicio de sesión
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          Ir a la página principal
        </Link>
      </div>
    </div>
  );
}

// Componente principal que usa Suspense
export default function ErrorPage() {
  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl px-4 py-8 shadow-xl sm:px-8">
        <Suspense fallback={<div>Cargando...</div>}>
          <ErrorContent />
        </Suspense>
      </div>
    </div>
  );
}
