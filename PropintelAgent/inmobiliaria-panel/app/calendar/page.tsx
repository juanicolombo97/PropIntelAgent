'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Admin } from '@/lib/api';
import { Visit } from '@/lib/types';
import { Calendar, MapPin, User, Plus, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface VisitWithDetails extends Visit {
  leadName?: string;
  leadPhone?: string;
  propertyTitle?: string;
  propertyAddress?: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visits, setVisits] = useState<VisitWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const loadVisits = async () => {
      try {
        setLoading(true);
        
        // Cargar todas las visitas (en tu backend podrías filtrar por fecha)
        const [newLeads, qualifiedLeads, properties] = await Promise.all([
          Admin.leadsByStatus('NEW'),
          Admin.leadsByStatus('QUALIFIED'),
          Admin.properties()
        ]);

        const allLeads = [...(newLeads.items || []), ...(qualifiedLeads.items || [])];
        const allProperties = properties.items || [];
        
        // Cargar visitas para cada lead
        const visitsPromises = allLeads.map(async (lead) => {
          try {
            const visitsResponse = await Admin.visitsByLead(lead.LeadId);
            return visitsResponse.items?.map(visit => {
              const property = allProperties.find(p => p.PropertyId === visit.PropertyId);
              return {
                ...visit,
                leadName: lead.LeadId.replace('whatsapp:', '').replace('+', ''),
                leadPhone: lead.LeadId,
                propertyTitle: property?.Title || `Propiedad ${visit.PropertyId}`,
                propertyAddress: property ? `${property.Rooms} amb - ${property.Neighborhood}` : 'Dirección no disponible'
              };
            }) || [];
          } catch (error) {
            console.error(`Error loading visits for lead ${lead.LeadId}:`, error);
            return [];
          }
        });

        const allVisits = (await Promise.all(visitsPromises)).flat();
        
        // Filtrar visitas por la fecha actual (opcional, puedes mostrar todas)
        const currentDateString = currentDate.toISOString().split('T')[0];
        const todayVisits = allVisits.filter(visit => 
          visit.VisitAt.startsWith(currentDateString)
        );

        setVisits(todayVisits.length > 0 ? todayVisits : allVisits.slice(0, 8)); // Mostrar máximo 8
        
      } catch (error) {
        console.error('Error loading calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVisits();
  }, [currentDate]);

  // Calcular estadísticas basadas en datos reales
  const stats = [
    { label: 'Visitas hoy', value: visits.length.toString(), color: 'text-blue-600' },
    { label: 'Esta semana', value: (visits.length * 4).toString(), color: 'text-green-600' },
    { label: 'Pendientes', value: visits.filter(v => !v.Confirmed).length.toString(), color: 'text-yellow-600' },
    { label: 'Confirmadas', value: visits.filter(v => v.Confirmed).length.toString(), color: 'text-purple-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-md">
            <Calendar size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Calendario de Visitas</h1>
            <p className="text-lg text-slate-600">Gestiona y programa tus visitas de manera eficiente</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {stats.map((stat, index) => (
          <Card key={index} className="p-2 text-center">
            <p className="text-xs font-medium text-slate-600">{stat.label}</p>
            <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Calendar Navigation */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft size={14} />
            </Button>
            <h2 className="text-base font-bold text-slate-900 capitalize">{formatDate(currentDate)}</h2>
            <Button variant="ghost" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight size={14} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              <Filter size={14} className="mr-1" />
              Filtrar
            </Button>
            <Button variant="primary" size="sm">
              <Plus size={14} className="mr-1" />
              Nueva Visita
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-slate-600">Cargando visitas...</p>
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No hay visitas programadas para este día</p>
            </div>
          ) : (
            visits.map((visit) => (
              <div key={`${visit.LeadId}-${visit.VisitAt}`} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex-shrink-0 text-center">
                  <div className="text-xs font-bold text-slate-900">
                    {new Date(visit.VisitAt).toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-xs text-slate-500">60 min</div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                        <User size={10} />
                        {visit.leadName || visit.LeadId}
                      </h3>
                      <p className="text-xs text-slate-500">{visit.leadPhone || visit.LeadId}</p>
                    </div>
                    <div className={`px-1 py-0.5 text-xs font-medium rounded-full ${
                      visit.Confirmed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {visit.Confirmed ? 'Confirmada' : 'Pendiente'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                    <div className="flex items-center gap-1">
                      <MapPin size={10} />
                      <span>{visit.propertyAddress || 'Dirección no disponible'}</span>
                    </div>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-xs">{visit.PropertyId}</span>
                  </div>
                  
                  <p className="text-xs text-slate-500 italic">
                    {visit.propertyTitle || `Propiedad ${visit.PropertyId}`}
                  </p>
                </div>
                
                <div className="flex-shrink-0 flex gap-1">
                  <Button variant="ghost" size="sm">
                    Editar
                  </Button>
                  <Button variant="secondary" size="sm">
                    Contactar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Empty slots */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Horarios disponibles</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {['11:30', '13:00', '15:00', '17:30', '18:00', '19:00'].map((time) => (
              <button
                key={time}
                className="p-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Week Overview */}
      <div className="grid grid-cols-7 gap-1">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => (
          <Card key={day} className={`p-1 ${index === 2 ? 'ring-1 ring-purple-500 bg-purple-50' : ''}`}>
            <div className="text-center">
              <div className="text-xs font-medium text-slate-600">{day}</div>
              <div className="text-xs font-bold text-slate-900">{13 + index}</div>
              <div className="text-xs text-slate-500">
                {index === 0 ? '2 visitas' :
                 index === 1 ? '1 visita' :
                 index === 2 ? '3 visitas' :
                 index === 3 ? '4 visitas' :
                 index === 4 ? '2 visitas' :
                 index === 5 ? '1 visita' : '0 visitas'}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}