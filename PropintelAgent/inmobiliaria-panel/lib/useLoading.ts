import { useState, useCallback } from 'react';

export function useLoading() {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const startLoading = useCallback((message = 'Cargando...') => {
    setLoading(true);
    setLoadingMessage(message);
  }, []);

  const stopLoading = useCallback(() => {
    setLoading(false);
    setLoadingMessage('');
  }, []);

  const withLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    message = 'Cargando...'
  ): Promise<T> => {
    startLoading(message);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    loading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading
  };
} 