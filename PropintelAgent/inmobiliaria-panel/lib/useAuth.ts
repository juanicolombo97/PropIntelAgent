'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  username: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Iniciando logout...');
      
      // Llamar al endpoint de logout
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      
      console.log('✅ Logout response:', response.status);
      
      // Limpiar el estado del usuario
      setUser(null);
      
      // Intentar redirección con router
      console.log('🔄 Redirigiendo a /login...');
      router.push('/login');
      
      // Fallback: si después de 1 segundo no se redirigió, usar window.location
      setTimeout(() => {
        console.log('⏰ Timeout de redirección, usando window.location');
        window.location.href = '/login';
      }, 1000);
      
    } catch (error) {
      console.error('💥 Error al cerrar sesión:', error);
      // Fallback inmediato en caso de error
      setUser(null);
      window.location.href = '/login';
    }
  };

  return { user, loading, logout, checkAuth };
}