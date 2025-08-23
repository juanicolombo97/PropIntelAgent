'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export function PropertyFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentNeighborhood = searchParams.get('neighborhood') || '';
  const [neighborhood, setNeighborhood] = useState(currentNeighborhood);

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (neighborhood.trim()) {
      params.set('neighborhood', neighborhood.trim());
    }
    router.push(`/properties?${params.toString()}`);
  };

  const handleClear = () => {
    setNeighborhood('');
    router.push('/properties');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFilter();
    }
  };

  return (
    <Card title="Filtrar Propiedades">
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Filtrar por barrio..."
            size="md"
          />
        </div>
        <Button onClick={handleFilter} variant="primary">
          <Search size={16} className="mr-2" />
          Filtrar
        </Button>
        {currentNeighborhood && (
          <Button onClick={handleClear} variant="secondary">
            <X size={16} className="mr-2" />
            Limpiar
          </Button>
        )}
      </div>
      {currentNeighborhood && (
        <div className="mt-3 text-sm text-gray-600">
          Mostrando propiedades en: <strong>{currentNeighborhood}</strong>
        </div>
      )}
    </Card>
  );
} 