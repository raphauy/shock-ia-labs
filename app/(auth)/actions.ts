'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';

import { createUser, getUser } from '@/lib/db/queries';

import { signIn } from './auth';

const emailSchema = z.object({
  email: z.string().email(),
});

export interface LoginActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'invalid_data'
    | 'check_email'
    | 'user_not_found';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    console.log('Comenzando proceso de login');
    const validatedData = emailSchema.parse({
      email: formData.get('email'),
    });
    console.log('Email validado:', validatedData.email);

    // Verificar si el usuario existe en la base de datos
    const users = await getUser(validatedData.email);
    console.log('Usuario encontrado:', users.length > 0 ? 'Sí' : 'No');

    if (users.length === 0) {
      console.log('Usuario no encontrado, retornando user_not_found');
      return { status: 'user_not_found' };
    }

    try {
      console.log('Intentando signIn con Resend');
      console.log(
        'Configuración de RESEND_API_KEY:',
        process.env.RESEND_API_KEY
          ? `Configurada (longitud: ${process.env.RESEND_API_KEY.length})`
          : 'No configurada',
      );
      console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

      try {
        // Usar '/' como la URL absoluta para evitar problemas con URLs relativas
        const callbackUrl = new URL(
          '/',
          process.env.NEXTAUTH_URL || 'http://localhost:3000',
        ).toString();
        console.log('Usando callback URL:', callbackUrl);

        const result = await signIn('resend', {
          email: validatedData.email,
          redirect: false,
          callbackUrl,
        });

        console.log('Resultado de signIn:', JSON.stringify(result, null, 2));

        if (result?.error) {
          console.error('Error en el resultado de signIn:', result.error);
          return { status: 'failed' };
        }
      } catch (innerError) {
        console.error('Error detallado durante signIn:', innerError);
        if (innerError instanceof Error) {
          console.error('Mensaje de error:', innerError.message);
          console.error('Stack trace:', innerError.stack);
        }
        throw innerError; // Re-lanzar para el manejo exterior
      }
    } catch (signInError) {
      console.error('Error durante signIn:', signInError);
      return { status: 'failed' };
    }

    // Retornar el estado check_email en lugar de redirigir
    return { status: 'check_email' };
  } catch (error) {
    // Verificar si es un error de redirección y propagarlo
    if (
      error instanceof Error &&
      'digest' in error &&
      (error as any).digest?.startsWith('NEXT_REDIRECT')
    ) {
      throw error; // Propagar el error de redirección
    }

    console.error('Error en login action:', error);
    if (error instanceof z.ZodError) {
      console.log('Error de validación Zod:', error.errors);
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data'
    | 'check_email';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    console.log('Comenzando proceso de registro');
    const validatedData = emailSchema.parse({
      email: formData.get('email'),
    });
    console.log('Email validado:', validatedData.email);

    const [user] = await getUser(validatedData.email);
    console.log('Usuario encontrado:', user ? 'Sí' : 'No');

    if (!user) {
      // Crear el usuario si no existe
      console.log('Creando nuevo usuario');
      await createUser(validatedData.email, '');
      console.log('Usuario creado con éxito');
    }

    // Enviar magic link
    try {
      console.log('Intentando signIn con Resend para nuevo usuario');
      console.log(
        'Configuración de RESEND_API_KEY:',
        process.env.RESEND_API_KEY
          ? `Configurada (longitud: ${process.env.RESEND_API_KEY.length})`
          : 'No configurada',
      );
      console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

      try {
        // Usar '/' como la URL absoluta para evitar problemas con URLs relativas
        const callbackUrl = new URL(
          '/',
          process.env.NEXTAUTH_URL || 'http://localhost:3000',
        ).toString();
        console.log('Usando callback URL:', callbackUrl);

        const result = await signIn('resend', {
          email: validatedData.email,
          redirect: false,
          callbackUrl,
        });

        console.log('Resultado de signIn:', JSON.stringify(result, null, 2));

        if (result?.error) {
          console.error('Error en el resultado de signIn:', result.error);
          return { status: 'failed' };
        }
      } catch (innerError) {
        console.error('Error detallado durante signIn:', innerError);
        if (innerError instanceof Error) {
          console.error('Mensaje de error:', innerError.message);
          console.error('Stack trace:', innerError.stack);
        }
        throw innerError; // Re-lanzar para el manejo exterior
      }
    } catch (signInError) {
      console.error('Error durante signIn:', signInError);
      return { status: 'failed' };
    }

    // Redireccionar a la página de verificación
    console.log('Redirigiendo a la página de verificación');
    redirect(
      `/verify-request?email=${encodeURIComponent(validatedData.email)}`,
    );
  } catch (error) {
    // Verificar si es un error de redirección y propagarlo
    if (
      error instanceof Error &&
      'digest' in error &&
      (error as any).digest?.startsWith('NEXT_REDIRECT')
    ) {
      throw error; // Propagar el error de redirección
    }

    console.error('Error en register action:', error);
    if (error instanceof z.ZodError) {
      console.log('Error de validación Zod:', error.errors);
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }

  // Esta línea nunca se ejecutará debido al redirect, pero TypeScript la necesita
  return { status: 'check_email' };
};
