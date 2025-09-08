'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchAllLeads } from '@/lib/slices/leadsSlice';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { CreateLeadModal } from '@/components/leads/CreateLeadModal';
import { LeadDetailModal } from '@/components/leads/LeadDetailModal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { User, Plus, Filter, TrendingUp, DollarSign, MapPin } from 'lucide-react';

export default function LeadsPage() {
  const dispatch = useAppDispatch();
  const { items: leads, loading } = useAppSelector(state => state.leads);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'NUEVO' | 'CALIFICANDO' | 'CALIFICADO' | 'AGENDANDO_VISITA' | 'PROCESO_COMPLETADO' | 'BUSCANDO_PROPIEDAD'>('all');

  // Los datos se cargan automáticamente al inicializar la aplicación
  // No necesitamos cargar datos aquí

  const handleLeadClick = (lead: any) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleLeadCreated = () => {
    dispatch(fetchAllLeads());
  };

  // Filtrar leads por status
  const filteredLeads = filterStatus === 'all' 
    ? leads 
    : leads.filter(lead => lead.Status === filterStatus);

  // Estadísticas
  const stats = {
    total: leads.length,
    nuevo: leads.filter(lead => lead.Status === 'NUEVO').length,
    calificando: leads.filter(lead => lead.Status === 'CALIFICANDO').length,
    calificado: leads.filter(lead => lead.Status === 'CALIFICADO').length,
    agendando: leads.filter(lead => lead.Status === 'AGENDANDO_VISITA').length,
    completado: leads.filter(lead => lead.Status === 'PROCESO_COMPLETADO').length,
    buscando: leads.filter(lead => lead.Status === 'BUSCANDO_PROPIEDAD').length,
    avgBudget: leads.length > 0 
      ? Math.round(leads.reduce((sum, lead) => sum + (lead.Budget || 0), 0) / leads.length)
      : 0
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-md">
            <User size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Gestión de Leads</h1>
            <p className="text-lg text-slate-600">Administra y sigue tus prospectos</p>
          </div>
        </div>
        <Button 
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Nuevo Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Leads</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <User size={24} className="text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Nuevos</p>
              <p className="text-2xl font-bold text-slate-900">{stats.nuevo}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp size={20} className="text-yellow-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Calificados</p>
              <p className="text-2xl font-bold text-slate-900">{stats.calificado}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <User size={20} className="text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Presupuesto Promedio</p>
              <p className="text-2xl font-bold text-slate-900">
                ${stats.avgBudget.toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign size={20} className="text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Filtrar por:</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              Todos ({leads.length})
            </Button>
            <Button
              variant={filterStatus === 'NUEVO' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('NUEVO')}
            >
              Nuevos ({stats.nuevo})
            </Button>
            <Button
              variant={filterStatus === 'CALIFICANDO' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('CALIFICANDO')}
            >
              Calificando ({stats.calificando})
            </Button>
            <Button
              variant={filterStatus === 'CALIFICADO' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('CALIFICADO')}
            >
              Calificados ({stats.calificado})
            </Button>
            <Button
              variant={filterStatus === 'BUSCANDO_PROPIEDAD' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterStatus('BUSCANDO_PROPIEDAD')}
            >
              Buscando Propiedad ({stats.buscando})
            </Button>
          </div>
        </div>
      </Card>

      {/* Leads Tables */}
      <div className="space-y-8">
        {filterStatus === 'all' && (
          <>
            <LeadsTable
              leads={leads.filter(lead => lead.Status === 'NUEVO')}
              title="Leads Nuevos"
              onLeadClick={handleLeadClick}
            />
            
            <LeadsTable
              leads={leads.filter(lead => lead.Status === 'CALIFICANDO')}
              title="Leads Calificando"
              onLeadClick={handleLeadClick}
            />
            
            <LeadsTable
              leads={leads.filter(lead => lead.Status === 'CALIFICADO')}
              title="Leads Calificados"
              onLeadClick={handleLeadClick}
            />
            
            <LeadsTable
              leads={leads.filter(lead => lead.Status === 'AGENDANDO_VISITA')}
              title="Agendando Visitas"
              onLeadClick={handleLeadClick}
            />
            
            <LeadsTable
              leads={leads.filter(lead => lead.Status === 'PROCESO_COMPLETADO')}
              title="Proceso Completado"
              onLeadClick={handleLeadClick}
            />
          </>
        )}
        
        {filterStatus !== 'all' && (
          <LeadsTable
            leads={filteredLeads}
            title={`Leads ${filterStatus}`}
            onLeadClick={handleLeadClick}
          />
        )}
      </div>

      {/* Create Lead Modal */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLeadCreated={handleLeadCreated}
      />

      {/* Lead Detail Modal */}
      <LeadDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        lead={selectedLead}
      />
    </div>
  );
}
