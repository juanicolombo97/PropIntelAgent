import { Lead, Message, Visit } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatTimestamp, formatDate } from '@/lib/utils';
import { MessageSquare, Calendar, User, Phone, MapPin, DollarSign, Clock } from 'lucide-react';

interface LeadActivityProps {
  lead: Lead;
  messages: Message[];
  visits: Visit[];
}

export function LeadActivity({ lead, messages, visits }: LeadActivityProps) {
  // Función para generar actividad basada en datos reales
  const getActivityItems = () => {
    const activities = [];
    
    // Actividad de creación del lead
    if (lead.CreatedAt) {
      activities.push({
        id: 'created',
        type: 'created',
        title: 'Lead creado',
        description: 'Lead registrado en el sistema',
        timestamp: lead.CreatedAt,
        icon: User,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      });
    }
    
    // Actividad de actualización del lead
    if (lead.UpdatedAt && lead.UpdatedAt !== lead.CreatedAt) {
      activities.push({
        id: 'updated',
        type: 'updated',
        title: 'Información actualizada',
        description: 'Datos del lead modificados',
        timestamp: lead.UpdatedAt,
        icon: User,
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      });
    }
    
    // Actividad de mensajes
    messages.forEach((message, index) => {
      activities.push({
        id: `message_${message.Timestamp}`,
        type: message.Direction === 'in' ? 'message_received' : 'message_sent',
        title: message.Direction === 'in' ? 'Mensaje recibido' : 'Mensaje enviado',
        description: message.Text.length > 50 ? `${message.Text.substring(0, 50)}...` : message.Text,
        timestamp: message.Timestamp,
        icon: MessageSquare,
        color: message.Direction === 'in' ? 'text-blue-600' : 'text-green-600',
        bgColor: message.Direction === 'in' ? 'bg-blue-100' : 'bg-green-100'
      });
    });
    
    // Actividad de visitas
    visits.forEach((visit) => {
      activities.push({
        id: `visit_${visit.VisitAt}`,
        type: 'visit',
        title: 'Visita programada',
        description: `Visita a propiedad ${visit.PropertyId}`,
        timestamp: visit.VisitAt,
        icon: Calendar,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      });
    });
    
    // Ordenar por timestamp (más reciente primero)
    return activities.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
  };

  const activities = getActivityItems();

  const getActivityIcon = (icon: any, color: string, bgColor: string) => {
    const IconComponent = icon;
    return (
      <div className={`p-2 rounded-full ${bgColor}`}>
        <IconComponent size={16} className={color} />
      </div>
    );
  };

  const getActivityBadge = (type: string) => {
    const badges = {
      created: <Badge variant="info" size="sm">Creado</Badge>,
      updated: <Badge variant="success" size="sm">Actualizado</Badge>,
      message_received: <Badge variant="info" size="sm">Recibido</Badge>,
      message_sent: <Badge variant="success" size="sm">Enviado</Badge>,
      visit: <Badge variant="warning" size="sm">Visita</Badge>
    };
    return badges[type as keyof typeof badges] || <Badge variant="default" size="sm">Actividad</Badge>;
  };

  return (
    <Card title="Actividad del Lead">
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.icon, activity.color, activity.bgColor)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                  {getActivityBadge(activity.type)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={12} />
                  {formatTimestamp(activity.timestamp)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No hay actividad</p>
            <p className="text-sm">Este lead aún no tiene actividad registrada</p>
          </div>
        )}
      </div>
      
      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Total de actividades: {activities.length}</span>
            <span>
              {activities.filter(a => a.type === 'message_received').length} mensajes recibidos, 
              {activities.filter(a => a.type === 'message_sent').length} enviados,
              {activities.filter(a => a.type === 'visit').length} visitas
            </span>
          </div>
        </div>
      )}
    </Card>
  );
} 