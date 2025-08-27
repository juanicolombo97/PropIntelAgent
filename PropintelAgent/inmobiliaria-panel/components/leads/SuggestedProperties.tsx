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
    
    // Si el lead tiene barrio preferido, sugerir propiedades en esa zona
    if (lead.Neighborhood) {
      properties.push({
        id: `prop_${lead.Neighborhood.toLowerCase()}_1`,
        title: `Departamento en ${lead.Neighborhood}`,
        neighborhood: lead.Neighborhood,
        rooms: lead.Rooms || 2,
        price: lead.Budget ? Math.round(lead.Budget * 0.9) : 150000,
        status: 'ACTIVE',
        url: '#'
      });
      
      properties.push({
        id: `prop_${lead.Neighborhood.toLowerCase()}_2`,
        title: `Casa en ${lead.Neighborhood}`,
        neighborhood: lead.Neighborhood,
        rooms: (lead.Rooms || 2) + 1,
        price: lead.Budget ? Math.round(lead.Budget * 1.1) : 200000,
        status: 'ACTIVE',
        url: '#'
      });
    }
    
    // Si no hay barrio, sugerir propiedades generales
    if (properties.length === 0) {
      properties.push({
        id: 'prop_general_1',
        title: 'Departamento 2 ambientes',
        neighborhood: 'Centro',
        rooms: 2,
        price: 180000,
        status: 'ACTIVE',
        url: '#'
      });
      
      properties.push({
        id: 'prop_general_2',
        title: 'Casa 3 ambientes',
        neighborhood: 'Residencial',
        rooms: 3,
        price: 250000,
        status: 'ACTIVE',
        url: '#'
      });
    }
    
    return properties;
  };

  const properties = getSuggestedProperties();

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
              Sugerida basada en: {lead.Neighborhood ? `barrio preferido (${lead.Neighborhood})` : 'criterios generales'}
              {lead.Rooms && `, ${lead.Rooms} ambientes`}
              {lead.Budget && `, presupuesto $${formatCurrency(lead.Budget)}`}
            </div>
          </div>
        ))}
        
        {properties.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No hay propiedades sugeridas</p>
            <p className="text-sm">Completa más información del lead para recibir sugerencias</p>
          </div>
        )}
      </div>
    </Card>
  );
} 