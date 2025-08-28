import { Lead } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { MapPin, Bed, DollarSign, ExternalLink } from 'lucide-react';

interface SuggestedPropertiesProps {
  lead: Lead;
}

export function SuggestedProperties({ lead }: SuggestedPropertiesProps) {
  // Función para generar propiedades sugeridas basadas en los datos del lead
  const getSuggestedProperties = () => {
    const properties = [];
    
    // Solo sugerir si el lead tiene datos suficientes
    if (lead.Neighborhood && lead.Budget && lead.Rooms) {
      properties.push({
        id: `prop_${lead.Neighborhood.toLowerCase()}_1`,
        title: `Departamento en ${lead.Neighborhood}`,
        neighborhood: lead.Neighborhood,
        rooms: lead.Rooms,
        price: Math.round(lead.Budget * 0.9),
        status: 'ACTIVE',
        url: '#'
      });
      
      properties.push({
        id: `prop_${lead.Neighborhood.toLowerCase()}_2`,
        title: `Casa en ${lead.Neighborhood}`,
        neighborhood: lead.Neighborhood,
        rooms: lead.Rooms + 1,
        price: Math.round(lead.Budget * 1.1),
        status: 'ACTIVE',
        url: '#'
      });
    }
    
    return properties;
  };

  const properties = getSuggestedProperties();

  // Solo mostrar el componente si hay propiedades sugeridas
  if (properties.length === 0) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    return status === 'ACTIVE' ? (
      <Badge variant="success" size="sm">Disponible</Badge>
    ) : (
      <Badge variant="warning" size="sm">Reservada</Badge>
    );
  };

  return (
    <Card title="Propiedades Sugeridas">
      <div className="space-y-4">
        {properties.map((property) => (
          <div key={property.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{property.title}</h4>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    {property.neighborhood}
                  </div>
                  <div className="flex items-center gap-1">
                    <Bed size={14} />
                    {property.rooms} ambientes
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign size={14} />
                    {formatCurrency(property.price)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(property.status)}
                <a 
                  href={property.url} 
                  className="p-1 text-blue-600 hover:text-blue-800"
                  title="Ver detalles"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Sugerida basada en: barrio preferido ({lead.Neighborhood}), {lead.Rooms} ambientes, presupuesto ${lead.Budget ? formatCurrency(lead.Budget) : 'No especificado'}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
} 