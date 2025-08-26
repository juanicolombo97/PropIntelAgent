import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticated } from './lib/auth';

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acceso a rutas públicas
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Permitir acceso a archivos estáticos
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Permitir acceso a rutas de autenticación sin verificar
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Verificar autenticación para todas las demás rutas
  const user = await isAuthenticated(request);

  if (!user) {
    // Redirigir a login si no está autenticado
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Agregar información del usuario a las headers para uso en las páginas
  const response = NextResponse.next();
  response.headers.set('x-user-username', user.username);
  response.headers.set('x-user-role', user.role);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};