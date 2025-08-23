import { Property } from '@/lib/types';
import { Table, TableHeader, TableRow, TableCell, TableHeaderCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { ExternalLink, Edit } from 'lucide-react';

interface PropertiesTableProps {
  properties: Property[];
  onPropertyClick?: (property: Property) => void;
}

export function PropertiesTable({ properties, onPropertyClick }: PropertiesTableProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'success' as const,
      INACTIVE: 'default' as const,
      SOLD: 'danger' as const,
    };
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>Título</TableHeaderCell>
            <TableHeaderCell>Barrio</TableHeaderCell>
            <TableHeaderCell>Habitaciones</TableHeaderCell>
            <TableHeaderCell>Precio</TableHeaderCell>
            <TableHeaderCell>Estado</TableHeaderCell>
            <TableHeaderCell>Acciones</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {properties?.map((property) => (
            <TableRow 
              key={property.PropertyId}
              onClick={() => onPropertyClick?.(property)}
              className="cursor-pointer hover:bg-slate-50"
            >
              <TableCell className="font-mono text-sm">{property.PropertyId}</TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate" title={property.Title}>
                  {property.Title}
                </div>
              </TableCell>
              <TableCell>{property.Neighborhood}</TableCell>
              <TableCell>{property.Rooms}</TableCell>
              <TableCell className="font-medium">{formatCurrency(property.Price)}</TableCell>
              <TableCell>{getStatusBadge(property.Status)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {property.URL && (
                    <a
                      href={property.URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                      title="Ver propiedad"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <EditPriceForm propertyId={property.PropertyId} currentPrice={property.Price} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
      {(!properties || properties.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          No hay propiedades disponibles
        </div>
      )}
    </Card>
  );
}

function EditPriceForm({ propertyId, currentPrice }: { propertyId: string; currentPrice: number }) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const price = Number(formData.get('Price'));
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Price: price }),
      });
      // Opcional: recargar la página o actualizar el estado
      window.location.reload();
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        name="Price"
        type="number"
        defaultValue={currentPrice}
        className="border px-2 py-1 rounded w-24 text-sm"
        min="0"
        step="1000"
      />
      <Button type="submit" size="sm" variant="primary">
        <Edit size={14} />
      </Button>
    </form>
  );
} 