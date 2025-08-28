import { Property } from '@/lib/types';
import { Table, TableHeader, TableRow, TableCell, TableHeaderCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

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
      <div className="max-h-[420px] overflow-y-auto">
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
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
      {(!properties || properties.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          No hay propiedades disponibles
        </div>
      )}
    </Card>
  );
}

 