'use client';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchAllVisits } from '@/lib/slices/visitsSlice';
import { fetchAllLeads as fetchLeads } from '@/lib/slices/leadsSlice';
import { fetchAllProperties as fetchProps } from '@/lib/slices/propertiesSlice';
import { 
  setCreateModalOpen, 
  setSelectedDate, 
  setViewMode,
  goToPreviousMonth, 
  goToNextMonth, 
  goToToday 
} from '@/lib/slices/calendarSlice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, MapPin, User, Home, RefreshCw } from 'lucide-react';
import { CreateVisitModal } from '@/components/calendar/CreateVisitModal';

export default function CalendarPage() {
  const dispatch = useAppDispatch();
  const { currentDate: currentDateString, selectedDate, isCreateModalOpen, viewMode } = useAppSelector(state => state.calendar);
  const currentDate = new Date(currentDateString);
  const { items: visits, loading: visitsLoading } = useAppSelector(state => state.visits);
  const { items: leads, loading: leadsLoading } = useAppSelector(state => state.leads);
  const { items: properties, loading: propertiesLoading } = useAppSelector(state => state.properties);

  // Debug: Log los datos que llegan al calendario
  console.log('📅 Calendar Page Data:', {
    visits: { count: visits.length, loading: visitsLoading, items: visits },
    leads: { count: leads.length, loading: leadsLoading },
    properties: { count: properties.length, loading: propertiesLoading }
  });

  // Los datos se cargan automáticamente al inicializar la aplicación
  // No necesitamos cargar datos aquí

  const handleVisitCreated = () => {
    console.log('🔄 Recargando visitas después de crear una nueva...');
    dispatch(fetchAllVisits());
  };

  // Funciones para navegación del calendario
  const handlePreviousMonth = () => {
    dispatch(goToPreviousMonth());
  };

  const handleNextMonth = () => {
    dispatch(goToNextMonth());
  };

  const handleToday = () => {
    dispatch(goToToday());
  };

  const handleDayClick = (date: Date) => {
    dispatch(setSelectedDate(date));
    // Cambiar a vista de día
    dispatch(setViewMode('day'));
  };

  const handleCreateVisit = () => {
    dispatch(setCreateModalOpen(true));
  };

  const handleCloseModal = () => {
    dispatch(setCreateModalOpen(false));
  };

  const handleClearSelection = () => {
    dispatch(setSelectedDate(null));
    dispatch(setViewMode('month'));
  };

  // Generar días del mes
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Agregar días del mes anterior para completar la primera semana
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - startingDayOfWeek + i + 1),
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Agregar días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({
        date: currentDate,
        isCurrentMonth: true,
        isToday: currentDate.toDateString() === new Date().toDateString()
      });
    }

    // Agregar días del mes siguiente para completar la última semana
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        isToday: false
      });
    }

    return days;
  };

  // Obtener visitas para una fecha específica
  const getVisitsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    console.log('🗓️ Calendar Debug:', {
      searchingForDate: dateString,
      totalVisits: visits.length,
      allVisits: visits.map(v => ({
        id: v.LeadId,
        visitAt: v.VisitAt,
        parsedDate: new Date(v.VisitAt).toISOString().split('T')[0]
      }))
    });
    
    const filteredVisits = visits.filter(visit => {
      const visitDate = new Date(visit.VisitAt).toISOString().split('T')[0];
      return visitDate === dateString;
    });
    
    console.log('🗓️ Filtered visits for', dateString, ':', filteredVisits);
    return filteredVisits;
  };

  // Obtener información del lead
  const getLeadInfo = (leadId: string) => {
    return leads.find(lead => lead.LeadId === leadId);
  };

  // Obtener información de la propiedad
  const getPropertyInfo = (propertyId: string) => {
    return properties.find(property => property.PropertyId === propertyId);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long'
    });
  };

  const days = getDaysInMonth(currentDate);
  const loading = visitsLoading || leadsLoading || propertiesLoading;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-md">
            <Calendar size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Calendario de Visitas</h1>
            <p className="text-sm text-slate-600">Gestiona y programa visitas a propiedades</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => {
              console.log('🔄 Forzando recarga de visitas...');
              dispatch(fetchAllVisits());
            }}
            className="flex items-center gap-2"
            size="sm"
          >
            <RefreshCw size={16} />
            Recargar Visitas
          </Button>
          <Button 
            variant="primary"
            onClick={handleCreateVisit}
            className="flex items-center gap-2"
            size="sm"
          >
            <Plus size={16} />
            Nueva Visita
          </Button>
        </div>
      </div>

      {/* Stats Cards - Más compactos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">Total Visitas</p>
              <p className="text-lg font-bold text-slate-900">{visits.length}</p>
            </div>
            <Calendar size={18} className="text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">Confirmadas</p>
              <p className="text-lg font-bold text-slate-900">
                {visits.filter(v => v.Confirmed).length}
              </p>
            </div>
            <div className="p-1.5 bg-green-100 rounded-lg">
              <Clock size={14} className="text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">Pendientes</p>
              <p className="text-lg font-bold text-slate-900">
                {visits.filter(v => !v.Confirmed).length}
              </p>
            </div>
            <div className="p-1.5 bg-yellow-100 rounded-lg">
              <Clock size={14} className="text-yellow-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">Este Mes</p>
              <p className="text-lg font-bold text-slate-900">
                {visits.filter(v => {
                  const visitDate = new Date(v.VisitAt);
                  return visitDate.getMonth() === currentDate.getMonth() && 
                         visitDate.getFullYear() === currentDate.getFullYear();
                }).length}
              </p>
            </div>
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Calendar size={14} className="text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Calendar Navigation */}
      {viewMode === 'month' && (
        <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handlePreviousMonth} size="sm">
              <ChevronLeft size={18} />
            </Button>
            <h2 className="text-lg font-bold text-slate-900">{formatDate(currentDate)}</h2>
            <Button variant="ghost" onClick={handleNextMonth} size="sm">
              <ChevronRight size={18} />
            </Button>
          </div>
          <Button variant="secondary" onClick={handleToday} size="sm">
            Hoy
          </Button>
        </div>

        {/* Calendar Grid - Más compacto */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Day Headers */}
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="p-1 text-center font-semibold text-slate-600 text-xs">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((day, index) => {
            const dayVisits = getVisitsForDate(day.date);
            const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();

            return (
              <div
                key={index}
                className={`min-h-[60px] p-1 border border-slate-200 cursor-pointer transition-colors ${
                  day.isCurrentMonth 
                    ? 'bg-white hover:bg-slate-50' 
                    : 'bg-slate-50 text-slate-400'
                } ${
                  day.isToday 
                    ? 'ring-1 ring-blue-500' 
                    : ''
                } ${
                  isSelected 
                    ? 'bg-blue-50 border-blue-300' 
                    : ''
                }`}
                onClick={() => {
                  if (day.isCurrentMonth) {
                    handleDayClick(day.date);
                  }
                }}
              >
                <div className="text-xs font-medium mb-0.5">
                  {day.date.getDate()}
                </div>
                
                {/* Visits for this day - Ultra compacto */}
                <div className="space-y-0.5">
                  {dayVisits.slice(0, 1).map((visit) => {
                    const lead = getLeadInfo(visit.LeadId);
                    
                    return (
                      <div
                        key={visit.VisitAt}
                        className={`px-1 py-0.5 rounded text-xs ${
                          visit.Confirmed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Clock size={6} />
                          <span className="text-xs">{formatTime(visit.VisitAt)}</span>
                        </div>
                        <div className="truncate text-xs">
                          {lead?.LeadId?.slice(0, 6) || 'N/A'}
                        </div>
                      </div>
                    );
                  })}
                  
                  {dayVisits.length > 1 && (
                    <div className="text-xs text-slate-500 text-center">
                      +{dayVisits.length - 1}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      )}

      {/* Vista de Día */}
      {selectedDate && viewMode === 'day' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {selectedDate.toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <p className="text-sm text-slate-600">
                {getVisitsForDate(selectedDate).length} visita{getVisitsForDate(selectedDate).length !== 1 ? 's' : ''} programada{getVisitsForDate(selectedDate).length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleClearSelection}
                size="sm"
              >
                Volver al Mes
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateVisit}
                className="flex items-center gap-2"
                size="sm"
              >
                <Plus size={16} />
                Agregar Visita
              </Button>
            </div>
          </div>

          {/* Vista horaria del día */}
          <div className="space-y-2">
            {Array.from({ length: 24 }, (_, hour) => {
              const hourVisits = getVisitsForDate(selectedDate).filter(visit => {
                const visitHour = new Date(visit.VisitAt).getHours();
                return visitHour === hour;
              });

              return (
                <div key={hour} className="flex border-b border-slate-100 last:border-b-0">
                  {/* Hora */}
                  <div className="w-20 p-3 text-sm font-medium text-slate-600 bg-slate-50 flex-shrink-0">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  
                  {/* Contenido de la hora */}
                  <div className="flex-1 p-3 min-h-[60px]">
                    {hourVisits.length === 0 ? (
                      <div className="text-slate-400 text-sm">Sin eventos</div>
                    ) : (
                      <div className="space-y-2">
                        {hourVisits.map((visit) => {
                          const lead = getLeadInfo(visit.LeadId);
                          const property = getPropertyInfo(visit.PropertyId);
                          const visitTime = new Date(visit.VisitAt);
                          
                          return (
                            <div
                              key={visit.VisitAt}
                              className={`p-3 rounded-lg border ${
                                visit.Confirmed 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-yellow-50 border-yellow-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full ${
                                    visit.Confirmed 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-yellow-100 text-yellow-600'
                                  }`}>
                                    <Clock size={14} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {visitTime.toLocaleTimeString('es-AR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                      {lead?.LeadId || 'Lead no encontrado'} • {property?.Title || 'Propiedad no encontrada'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={visit.Confirmed ? 'success' : 'warning'}
                                    size="sm"
                                  >
                                    {visit.Confirmed ? 'Confirmada' : 'Pendiente'}
                                  </Badge>
                                </div>
                              </div>
                              {visit.Notes && (
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                  <p className="text-sm text-slate-600">
                                    <strong>Notas:</strong> {visit.Notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Create Visit Modal */}
      <CreateVisitModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onVisitCreated={handleVisitCreated}
        selectedDate={selectedDate}
        leads={leads}
        properties={properties}
      />
    </div>
  );
}