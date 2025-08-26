import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const token = await createToken(user);
    
    console.log('🔐 Token generated:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
    });

    // Crear respuesta con el token en una cookie
    const response = NextResponse.json({
      success: true,
      user: { username: user.username, role: user.role }
    });

    // Configurar cookie con el token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: false, // Cambiar a false para que funcione en Vercel
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/'
    });
    
    console.log('🍪 Cookie configurada:', {
      name: 'auth-token',
      hasToken: !!token,
      tokenLength: token?.length,
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}