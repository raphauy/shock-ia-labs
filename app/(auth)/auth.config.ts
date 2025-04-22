import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
    verifyRequest: '/verify-request', // Página a mostrar después de enviar el enlace
    error: '/error', // Página para mostrar errores de autenticación
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Asegurarnos de que los redirects funcionen correctamente
      console.log('Redirect callback - URL:', url);
      console.log('Redirect callback - Base URL:', baseUrl);

      // Si la URL comienza con /, combinarla con baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Si la URL ya es completa y pertenece al mismo origen, devolverla
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Si la URL contiene 'callback', redirigir a la página principal
      else if (url.includes('/callback/')) {
        return baseUrl;
      }
      // En cualquier otro caso, redirigir a la página principal
      return baseUrl;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnChat = nextUrl.pathname.startsWith('/');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isOnVerify = nextUrl.pathname.startsWith('/verify-request');
      const isAuthCallback = nextUrl.pathname.startsWith('/api/auth/callback');

      // Siempre permitir acceso a las rutas de callback
      if (isAuthCallback) {
        return true;
      }

      if (isLoggedIn && (isOnLogin || isOnRegister || isOnVerify)) {
        return Response.redirect(new URL('/', nextUrl as unknown as URL));
      }

      if (isOnRegister || isOnLogin || isOnVerify) {
        return true; // Always allow access to register and login pages
      }

      // Especial para la ruta principal
      if (nextUrl.pathname === '/') {
        if (isLoggedIn) return true;
        return Response.redirect(new URL('/login', nextUrl as unknown as URL));
      }

      if (isOnChat) {
        if (isLoggedIn) return true;
        return Response.redirect(new URL('/login', nextUrl as unknown as URL));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
