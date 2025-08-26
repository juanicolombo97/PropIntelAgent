'use client';

import { useEffect } from 'react';
import { useLoading } from '@/lib/useLoading';
import { setGlobalLoading } from '@/lib/api';

interface LoadingProviderProps {
  children: React.ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const loading = useLoading();

  useEffect(() => {
    setGlobalLoading(loading);
  }, [loading]);

  return <>{children}</>;
} 