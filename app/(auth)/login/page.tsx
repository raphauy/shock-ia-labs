'use client';

import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';
import { useRouter } from 'next/navigation';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { login, type LoginActionState } from '../actions';

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  console.log('Estado actual de login:', state);

  useEffect(() => {
    console.log('Estado cambiado:', state.status);
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: 'Error al iniciar sesión. Inténtalo de nuevo.',
      });
      setIsSuccessful(false);
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Por favor, ingresa un email válido.',
      });
      setIsSuccessful(false);
    } else if (state.status === 'check_email') {
      setIsSuccessful(true);
      toast({
        type: 'success',
        description: 'Enlace enviado. Revisa tu correo electrónico.',
      });

      // Redirigir a la página de verificación después de mostrar el mensaje
      setTimeout(() => {
        router.push(`/verify-request?email=${encodeURIComponent(email)}`);
      }, 1500);
    } else if (state.status === 'user_not_found') {
      toast({
        type: 'error',
        description:
          'Usuario no encontrado. Contacta a Rapha para obtener acceso.',
      });
      setIsSuccessful(false);
    }
  }, [state.status, email, router]);

  const handleSubmit = (formData: FormData) => {
    console.log('Enviando formulario con email:', formData.get('email'));
    setEmail(formData.get('email') as string);
    setIsSuccessful(false); // Reiniciar estado al enviar
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">
            Iniciar Sesión
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Ingresa tu correo electrónico para recibir un enlace de acceso
          </p>
          {state.status === 'failed' && (
            <p className="text-sm text-red-500 mt-2">
              Error al iniciar sesión. Inténtalo de nuevo.
            </p>
          )}
          {state.status === 'user_not_found' && (
            <div className="mt-2 p-3 border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 rounded-md">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Este usuario no existe en nuestra base de datos.
                <br />
                Contacta a Rapha para obtener acceso.
              </p>
            </div>
          )}
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Enviar enlace</SubmitButton>
        </AuthForm>
      </div>
    </div>
  );
}
