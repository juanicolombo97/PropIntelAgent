'use client';

import { useLoading } from '@/lib/useLoading';

export function LoadingOverlay() {
  const { loading, loadingMessage } = useLoading();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm mx-4">
        <div className="flex items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{loadingMessage}</p>
            <p className="text-sm text-slate-600">Por favor espera...</p>
          </div>
        </div>
      </div>
    </div>
  );
} 