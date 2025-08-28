import { Lead } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatCurrency } from '@/lib/utils';

interface LeadProfileProps {
  lead: Lead;
}

export function LeadProfile({ lead }: LeadProfileProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      NEW: 'warning' as const,
      QUALIFIED: 'success' as const,
      DISQUALIFIED: 'danger' as const,
    };
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  const formatBudget = (budget?: number) => {
    if (!budget) return '-';
    return formatCurrency(budget);
  };

  const profileFields = [
    { label: 'Nombre Completo', value: lead.FullName || '-' },
    { label: 'Teléfono', value: lead.Phone || '-' },
    { label: 'Estado', value: getStatusBadge(lead.Status) },
    { label: 'Intención', value: lead.Intent || '-' },
    { label: 'Habitaciones', value: lead.Rooms || '-' },
    { label: 'Presupuesto', value: formatBudget(lead.Budget) },
    { label: 'Barrio', value: lead.Neighborhood || '-' },
    { label: 'Etapa', value: lead.Stage || '-' },
    { label: 'Propiedad Pendiente', value: lead.PendingPropertyId || '-' },
  ];

  return (
    <Card title="Perfil del Lead">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profileFields.map((field) => (
          <div key={field.label} className="flex flex-col">
            <span className="text-sm font-medium text-gray-700 mb-1">{field.label}</span>
            <span className="text-sm text-gray-900">{field.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <span className="text-xs text-gray-500">
          <strong>Última actualización:</strong> {lead.UpdatedAt ? formatDate(lead.UpdatedAt) : '-'}
        </span>
      </div>
    </Card>
  );
} 