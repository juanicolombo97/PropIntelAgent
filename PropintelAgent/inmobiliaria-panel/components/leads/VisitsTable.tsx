import { Visit } from '@/lib/types';
import { Table, TableHeader, TableRow, TableCell, TableHeaderCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';

interface VisitsTableProps {
  visits: Visit[];
}

export function VisitsTable({ visits }: VisitsTableProps) {
  const getConfirmationBadge = (confirmed: boolean) => {
    return confirmed ? (
      <Badge variant="success" size="sm">
        <CheckCircle size={12} className="mr-1" />
        Confirmada
      </Badge>
    ) : (
      <Badge variant="warning" size="sm">
        <XCircle size={12} className="mr-1" />
        Pendiente
      </Badge>
    );
  };

  const formatVisitDate = (visitAt: string) => {
    try {
      const date = new Date(visitAt);
      return date.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return visitAt;
    }
  };

  return (
    <Card title="Visitas Programadas">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Fecha y Hora</TableHeaderCell>
            <TableHeaderCell>Propiedad</TableHeaderCell>
            <TableHeaderCell>Estado</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {visits?.map((visit) => (
            <TableRow key={visit.VisitAt}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-500" />
                  <span className="text-sm">{formatVisitDate(visit.VisitAt)}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">{visit.PropertyId}</TableCell>
              <TableCell>{getConfirmationBadge(visit.Confirmed)}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
      {(!visits || visits.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          No hay visitas programadas
        </div>
      )}
    </Card>
  );
} 