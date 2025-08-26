'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Admin } from '@/lib/api';
import { Visit } from '@/lib/types';
import { Calendar, MapPin, User, Plus, Filter, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface VisitWithDetails extends Visit {
  leadName?: string;
  leadPhone?: string;
  propertyTitle?: string;
  propertyAddress?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  visits: VisitWithDetails[];
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allVisits, setAllVisits] = useState<VisitWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  
  // Navegar entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Navegar entre días
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  // Generar calendario mensual
  const generateCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);
    
    // Día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
    const firstDayOfWeek = firstDay.getDay();
    // Ajustar para que lunes sea 0
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const days: CalendarDay[] = [];
    
    // Agregar días del mes anterior
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: isSameDay(day, new Date()),
        visits: getVisitsForDate(day)
      });
    }
    
    // Agregar días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i);
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday: isSameDay(day, new Date()),
        visits: getVisitsForDate(day)
      });
    }
    
    // Completar la semana
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: isSameDay(day, new Date()),
        visits: getVisitsForDate(day)
      });
    }
    
    return days;
  };

  // Verificar si dos fechas son el mismo día
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // Obtener visitas para una fecha específica
  const getVisitsForDate = (date: Date): VisitWithDetails[] => {
    const dateString = date.toISOString().split('T')[0];
    return allVisits.filter(visit => visit.VisitAt.startsWith(dateString));
  };

  // Obtener visitas para la fecha seleccionada
  const selectedDateVisits = getVisitsForDate(selectedDate);

  // Cargar datos
  useEffect(() => {
    const loadVisits = async () => {
      try {
        setLoading(true);
        
        // Cargar todas las visitas
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
        setAllVisits(allVisits);
        
      } catch (error) {
        console.error('Error loading calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVisits();
  }, []);

  const calendarDays = generateCalendarDays(currentDate);
  const monthName = currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const selectedDateFormatted = selectedDate.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Estadísticas
  const stats = [
    { label: 'Visitas este mes', value: allVisits.length.toString(), color: 'text-blue-600' },
    { label: 'Confirmadas', value: allVisits.filter(v => v.Confirmed).length.toString(), color: 'text-green-600' },
    { label: 'Pendientes', value: allVisits.filter(v => !v.Confirmed).length.toString(), color: 'text-yellow-600' },
    { label: 'Hoy', value: getVisitsForDate(new Date()).length.toString(), color: 'text-purple-600' }
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

      {/* View Mode Toggle */}
      <div className="flex justify-center">
        <div className="flex bg-slate-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'month' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Mes
          </Button>
          <Button
            variant={viewMode === 'day' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('day')}
          >
            Día
          </Button>
        </div>
      </div>

      {viewMode === 'month' ? (
        /* Vista Mensual */
        <Card className="p-4">
          {/* Navegación del mes */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft size={16} />
            </Button>
            <h2 className="text-lg font-bold text-slate-900 capitalize">{monthName}</h2>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
              <div key={day} className="p-2 text-center">
                <span className="text-xs font-medium text-slate-600">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendario */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedDate(day.date);
                  setViewMode('day');
                }}
                className={`p-2 text-left rounded-lg border transition-all hover:shadow-md ${
                  day.isToday
                    ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-200'
                    : day.isCurrentMonth
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                } ${
                  day.visits.length > 0
                    ? 'ring-2 ring-purple-200 border-purple-300'
                    : ''
                }`}
              >
                <div className="text-xs font-medium mb-1">
                  {day.date.getDate()}
                </div>
                {day.visits.length > 0 && (
                  <div className="space-y-1">
                    {day.visits.slice(0, 2).map((visit, visitIndex) => (
                      <div
                        key={visitIndex}
                        className={`text-xs p-1 rounded ${
                          visit.Confirmed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {new Date(visit.VisitAt).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    ))}
                    {day.visits.length > 2 && (
                      <div className="text-xs text-slate-500">
                        +{day.visits.length - 2} más
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>
      ) : (
        /* Vista Diaria */
        <Card className="p-4">
          {/* Navegación del día */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigateDay('prev')}>
                <ChevronLeft size={16} />
              </Button>
              <h2 className="text-lg font-bold text-slate-900 capitalize">{selectedDateFormatted}</h2>
              <Button variant="ghost" size="sm" onClick={() => navigateDay('next')}>
                <ChevronRight size={16} />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setViewMode('month')}>
                <Calendar size={14} className="mr-1" />
                Mes
              </Button>
              <Button variant="primary" size="sm">
                <Plus size={14} className="mr-1" />
                Nueva Visita
              </Button>
            </div>
          </div>

          {/* Visitas del día */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-slate-600">Cargando visitas...</p>
              </div>
            ) : selectedDateVisits.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Clock size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium mb-2">No hay visitas programadas</p>
                <p className="text-sm">Este día está libre para programar nuevas visitas</p>
                <Button variant="primary" size="sm" className="mt-4">
                  <Plus size={14} className="mr-1" />
                  Programar Visita
                </Button>
              </div>
            ) : (
              selectedDateVisits
                .sort((a, b) => new Date(a.VisitAt).getTime() - new Date(b.VisitAt).getTime())
                .map((visit) => (
                  <div key={`${visit.LeadId}-${visit.VisitAt}`} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex-shrink-0 text-center">
                      <div className="text-sm font-bold text-slate-900">
                        {new Date(visit.VisitAt).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="text-xs text-slate-500">60 min</div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                            <User size={12} />
                            {visit.leadName || visit.LeadId}
                          </h3>
                          <p className="text-xs text-slate-500">{visit.leadPhone || visit.LeadId}</p>
                        </div>
                        <div className={`px-2 py-1 text-xs font-medium rounded-full ${
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

          {/* Horarios disponibles */}
          {selectedDateVisits.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Horarios disponibles</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {['09:00', '10:30', '12:00', '14:00', '16:00', '17:30'].map((time) => (
                  <button
                    key={time}
                    className="p-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}