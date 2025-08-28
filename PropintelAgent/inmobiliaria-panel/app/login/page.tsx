'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  console.log('🔍 Login page loaded:', {
    redirectTo,
    searchParams: Object.fromEntries(searchParams.entries())
  });

          useEffect(() => {
          // Verificar si ya está autenticado
          const checkAuth = async () => {
            try {
              console.log('🔍 Checking authentication status...');
              const response = await fetch('/api/auth/me');
              console.log('🔍 Auth check response:', {
                status: response.status,
                ok: response.ok,
                statusText: response.statusText
              });
              
              if (response.ok) {
                // Ya está autenticado, redirigir
                console.log('🔄 Already authenticated, redirecting to:', redirectTo);
                router.push(redirectTo);
              } else {
                console.log('🔐 Not authenticated, staying on login page');
              }
            } catch (error) {
              // No autenticado, continuar en login
              console.log('🔐 Auth check error:', error);
            }
          };
      
          checkAuth();
        }, [router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔐 Login attempt:', { username });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Asegurar que se incluyan cookies
      });

      console.log('📡 Login response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.json();
      console.log('📄 Login data:', data);

                   if (response.ok) {
               console.log('✅ Login successful, redirecting to:', redirectTo);
               
               // Verificar cookies después del login
               console.log('🍪 Cookies after login:', document.cookie);
               
               // Login exitoso, redirigir
               try {
                 await router.push(redirectTo);
                 console.log('🔄 Router.push completed');
                 
                 // Timeout de seguridad para forzar redirección si router no funciona
                 setTimeout(() => {
                   console.log('⏰ Redirect timeout, forcing navigation');
                   window.location.href = redirectTo;
                 }, 2000);
                 
               } catch (redirectError) {
                 console.error('💥 Redirect error:', redirectError);
                 // Fallback: usar window.location
                 window.location.href = redirectTo;
               }
             } else {
        console.log('❌ Login failed:', data.error);
        setError(data.error || 'Error de autenticación');
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Panel Inmobiliario
            </h1>
            <p className="text-gray-600 mt-2">
              Ingresa tus credenciales para acceder
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Usuario"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Ingresa tu usuario"
              disabled={loading}
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Ingresa tu contraseña"
              disabled={loading}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

    
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}