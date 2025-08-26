import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambialo-en-produccion'
);

export interface AuthUser {
  username: string;
  role: string;
  email?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// API para autenticación con AWS Lambda/Backend
async function callAuthAPI(endpoint: string, data: any): Promise<any> {
  const API_BASE = process.env.WHATSAPP_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
  const API_KEY = process.env.ADMIN_API_KEY;
  
  if (!API_KEY) {
    console.warn('ADMIN_API_KEY no configurada, usando autenticación local');
    throw new Error('API_KEY no configurada');
  }

  const response = await fetch(`${API_BASE}/admin/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify(data),
    // Agregar timeout para evitar bloqueos
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Error desconocido');
    throw new Error(`Error en API ${response.status}: ${errorText}`);
  }

  return response.json();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({ 
    username: user.username, 
    role: user.role, 
    email: user.email,
    iat: Math.floor(Date.now() / 1000)
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      username: payload.username as string,
      role: payload.role as string,
      email: payload.email as string
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function authenticateUser(username: string, password: string): Promise<AuthUser | null> {
  // Intentar autenticación con AWS Lambda/Backend primero
  try {
    const result = await callAuthAPI('auth/login', { username, password });
    
    if (result.success && result.user) {
      return {
        username: result.user.username,
        role: result.user.role || 'admin',
        email: result.user.email
      };
    }
  } catch (error) {
    console.warn('Error en autenticación remota, usando fallback local:', error);
    
    // Fallback a credenciales de entorno solo en desarrollo/emergencia
    const fallbackUsername = process.env.ADMIN_USERNAME;
    const fallbackPassword = process.env.ADMIN_PASSWORD;
    
    if (fallbackUsername && fallbackPassword && 
        username === fallbackUsername && password === fallbackPassword) {
      console.log('Usando credenciales de fallback local');
      return { 
        username, 
        role: 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@local.dev'
      };
    }
  }
  
  return null;
}

// Función para validar usuarios remotamente (opcional)
export async function validateUserWithRemote(username: string): Promise<AuthUser | null> {
  try {
    const result = await callAuthAPI('auth/validate', { username });
    
    if (result.success && result.user) {
      return {
        username: result.user.username,
        role: result.user.role,
        email: result.user.email
      };
    }
  } catch (error) {
    console.warn('Error validando usuario remoto:', error);
  }
  
  return null;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  // Intentar obtener el token de las cookies
  const token = request.cookies.get('auth-token')?.value;
  
  if (token) {
    return token;
  }

  // Intentar obtener el token del header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
}

export async function isAuthenticated(request: NextRequest): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return null;
  }

  const user = await verifyToken(token);
  
  // Opcional: validar usuario con servicio remoto periódicamente
  if (user && Math.random() < 0.1) { // 10% de las veces validar remotamente
    try {
      const remoteUser = await validateUserWithRemote(user.username);
      if (remoteUser) {
        return remoteUser;
      }
    } catch (error) {
      // Ignorar errores de validación remota
      console.warn('Error en validación remota periódica:', error);
    }
  }

  return user;
}