import { Lead } from '@/lib/types';
import Link from 'next/link';
import { Table, TableHeader, TableRow, TableCell, TableHeaderCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatDate, formatCurrency } from '@/lib/utils';

interface LeadsTableProps {
  leads: Lead[];
  title: string;
  onLeadClick?: (lead: Lead) => void;
}

export function LeadsTable({ leads, title, onLeadClick }: LeadsTableProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      NUEVO: 'warning' as const,
      CALIFICANDO: 'info' as const,
      CALIFICADO: 'success' as const,
      AGENDANDO_VISITA: 'info' as const,
      PROCESO_COMPLETADO: 'default' as const,
      BUSCANDO_PROPIEDAD: 'warning' as const,
    };
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  const formatBudget = (budget?: number) => {
    if (!budget) return '-';
    return formatCurrency(budget);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Lead ID</TableHeaderCell>
              <TableHeaderCell>Nombre</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell>Etapa</TableHeaderCell>
              <TableHeaderCell>Intención</TableHeaderCell>
              <TableHeaderCell>Habitaciones</TableHeaderCell>
              <TableHeaderCell>Presupuesto</TableHeaderCell>
              <TableHeaderCell>Barrio</TableHeaderCell>
              <TableHeaderCell>Actualizado</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {leads?.map((lead) => (
                              <TableRow 
                  key={lead.LeadId} 
                  onClick={() => onLeadClick?.(lead)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                <TableCell>
                  <span 
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLeadClick?.(lead);
                    }}
                  >
                    {lead.LeadId}
                  </span>
                </TableCell>
                <TableCell>{lead.FullName || '-'}</TableCell>
                <TableCell>{getStatusBadge(lead.Status)}</TableCell>
                <TableCell>
                  <Badge variant="default">{lead.Stage || '-'}</Badge>
                </TableCell>
                <TableCell>{lead.Intent || '-'}</TableCell>
                <TableCell>{lead.Rooms || '-'}</TableCell>
                <TableCell>{formatBudget(lead.Budget)}</TableCell>
                <TableCell>{lead.Neighborhood || '-'}</TableCell>
                <TableCell className="text-gray-500">
                  {lead.UpdatedAt ? formatDate(lead.UpdatedAt) : '-'}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
        {(!leads || leads.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            No hay leads en esta categoría
          </div>
        )}
      </Card>
    </div>
  );
} 