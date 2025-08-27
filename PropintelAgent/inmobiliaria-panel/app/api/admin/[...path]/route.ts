import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '../../../../config/api';

const API_BASE = API_CONFIG.LAMBDA_API_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    const { searchParams } = new URL(request.url);
    const pathString = params.path.join('/');
    const queryString = searchParams.toString();
    
    // Construir la URL de destino
    const targetUrl = `${API_BASE}/admin/${pathString}${queryString ? `?${queryString}` : ''}`;
    
    // Obtener el body si existe
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      body = await request.text();
    }
    
               // Obtener el token JWT de las cookies
           const authToken = request.cookies.get('auth-token')?.value;
           
           // Log todas las cookies para debug
           const allCookies = request.cookies.getAll();
           console.log('🍪 All cookies in proxy:', allCookies.map(c => ({ name: c.name, value: c.value ? 'present' : 'empty' })));
           
           console.log('🔍 Debug proxy:', {
             hasAuthToken: !!authToken,
             tokenLength: authToken?.length,
             tokenPreview: authToken ? `${authToken.substring(0, 20)}...` : 'none',
             targetUrl,
             method
           });
    
    // Preparar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-api-key': API_CONFIG.ADMIN_API_KEY,
    };
    
    console.log('🔑 API Key configurada:', {
      hasApiKey: !!API_CONFIG.ADMIN_API_KEY,
      apiKeyLength: API_CONFIG.ADMIN_API_KEY?.length,
      apiKeyPreview: API_CONFIG.ADMIN_API_KEY ? `${API_CONFIG.ADMIN_API_KEY.substring(0, 10)}...` : 'none'
    });

    // Agregar el token JWT si existe
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log('✅ Token agregado al header Authorization');
    } else {
      console.log('❌ No se encontró token en las cookies');
    }

    // Hacer la petición al backend
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      return NextResponse.json(
        { error: `Backend error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Devolver la respuesta con headers CORS apropiados
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Manejar OPTIONS requests para CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    },
  });
}