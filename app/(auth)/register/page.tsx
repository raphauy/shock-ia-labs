'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { redirect, useSearchParams } from 'next/navigation';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { register, type RegisterActionState } from '../actions';
import { toast } from '@/components/toast';

export default function Page() {
  // register not allowed for now
  redirect('/login');

  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    if (state.status === 'user_exists') {
      toast({
        type: 'error',
        description: 'Esta cuenta ya existe. Intenta iniciar sesión.',
      });
    } else if (state.status === 'failed') {
      toast({
        type: 'error',
        description: 'Error al crear la cuenta. Inténtalo de nuevo.',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Por favor, ingresa un email válido.',
      });
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">
            Regístrate
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Crea una cuenta con tu correo electrónico
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Crear cuenta</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {'¿Ya tienes una cuenta? '}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Inicia sesión
            </Link>
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
