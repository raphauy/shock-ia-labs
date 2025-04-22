'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Componente interno que usa useSearchParams
function VerifyRequestContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="flex flex-col items-center justify-center gap-2 text-center">
      <h3 className="text-xl font-semibold dark:text-zinc-50">
        Revisa tu correo
      </h3>
      <p className="text-sm text-gray-500 dark:text-zinc-400">
        Hemos enviado un enlace de inicio de sesión a <strong>{email}</strong>
      </p>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mt-4">
        Haz clic en el enlace que te enviamos para iniciar sesión en tu cuenta.
      </p>
      <Link
        href="/login"
        className="mt-8 text-sm font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
      >
        ¿No recibiste el correo? Inténtalo de nuevo
      </Link>
    </div>
  );
}

// Componente principal que usa Suspense
export default function VerifyRequestPage() {
  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12 px-4 sm:px-16">
        <Suspense fallback={<div>Cargando...</div>}>
          <VerifyRequestContent />
        </Suspense>
      </div>
    </div>
  );
}
