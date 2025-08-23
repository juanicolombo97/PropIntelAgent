'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export function CreatePropertyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function action(formData: FormData) {
    setIsSubmitting(true);
    try {
      const payload = {
        PropertyId: String(formData.get('PropertyId')),
        Title: String(formData.get('Title')),
        Neighborhood: String(formData.get('Neighborhood')),
        Rooms: Number(formData.get('Rooms')),
        Price: Number(formData.get('Price')),
        Status: 'ACTIVE' as const,
        URL: String(formData.get('URL') || ''),
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al crear la propiedad');
      }

      // Reset form
      const form = document.getElementById('create-property-form') as HTMLFormElement;
      form?.reset();
      
      // Refresh page to show new property
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la propiedad');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card title="Crear Nueva Propiedad">
      <form id="create-property-form" action={action} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          name="PropertyId"
          label="ID de Propiedad"
          placeholder="Ej: PROP001"
          required
          size="md"
        />
        
        <Input
          name="Title"
          label="Título"
          placeholder="Ej: Departamento 2 ambientes"
          required
          size="md"
        />
        
        <Input
          name="Neighborhood"
          label="Barrio"
          placeholder="Ej: Palermo"
          required
          size="md"
        />
        
        <Input
          name="Rooms"
          label="Habitaciones"
          type="number"
          placeholder="2"
          min="1"
          required
          size="md"
        />
        
        <Input
          name="Price"
          label="Precio"
          type="number"
          placeholder="150000"
          min="0"
          step="1000"
          required
          size="md"
        />
        
        <Input
          name="URL"
          label="URL (opcional)"
          type="url"
          placeholder="https://..."
          size="md"
        />
        
        <div className="md:col-span-2 lg:col-span-3">
          <Button
            type="submit"
            variant="success"
            disabled={isSubmitting}
            className="w-full md:w-auto"
          >
            <Plus size={16} className="mr-2" />
            {isSubmitting ? 'Creando...' : 'Crear Propiedad'}
          </Button>
        </div>
      </form>
    </Card>
  );
} 