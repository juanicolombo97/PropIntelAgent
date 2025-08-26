import { NextResponse } from 'next/server';

export async function POST() {
  console.log('🍪 Eliminando cookie de autenticación...');
  
  const response = NextResponse.json({ 
    success: true,
    message: 'Sesión cerrada correctamente'
  });

  // Eliminar la cookie de autenticación
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: false, // Mantener false para compatibilidad con Vercel
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
    expires: new Date(0) // Forzar expiración inmediata
  });

  console.log('✅ Cookie eliminada, respuesta enviada');

  return response;
}