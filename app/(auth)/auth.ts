import NextAuth, { type Session, type User } from 'next-auth';
import ResendProvider from 'next-auth/providers/resend';
import { authConfig } from './auth.config';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';

interface ExtendedSession extends Session {
  user: User;
}

console.log('Inicializando NextAuth con la configuración:');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log(
  'RESEND_API_KEY:',
  process.env.RESEND_API_KEY
    ? `Configurado (primeros 4 caracteres: ${process.env.RESEND_API_KEY.substring(0, 4)})`
    : 'No configurado',
);

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  providers: [
    ResendProvider({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || 'noreply@agency-planner.com',
      maxAge: 3600, // 1 hora de validez para los enlaces
      generateVerificationToken: () => {
        // Generar un token aleatorio más corto para facilitar pruebas
        const tokenLength = 32;
        const characters =
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < tokenLength; i++) {
          token += characters.charAt(
            Math.floor(Math.random() * characters.length),
          );
        }
        return token;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Si tenemos un usuario después de la autenticación,
      // asegurarnos de almacenar su ID en el token
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      // Asegurarnos de que la información del usuario esté disponible en la sesión
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log('SignIn callback - user:', user ? 'presente' : 'no presente');
      console.log(
        'SignIn callback - account:',
        account ? 'presente' : 'no presente',
      );
      console.log(
        'SignIn callback - email:',
        email ? 'presente' : 'no presente',
      );

      // Siempre permitir iniciar sesión
      return true;
    },
  },
});
