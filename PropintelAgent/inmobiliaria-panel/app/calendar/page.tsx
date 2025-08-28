'use client';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchAllVisits } from '@/lib/slices/visitsSlice';
import { fetchAllLeads as fetchLeads } from '@/lib/slices/leadsSlice';
import { fetchAllProperties as fetchProps } from '@/lib/slices/propertiesSlice';
import { 
  setCreateModalOpen, 
  setSelectedDate, 
  goToPreviousMonth, 
  goToNextMonth, 
  goToToday 
} from '@/lib/slices/calendarSlice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, MapPin, User, Home } from 'lucide-react';
import { CreateVisitModal } from '@/components/calendar/CreateVisitModal';

export default function CalendarPage() {
  const dispatch = useAppDispatch();
  const { currentDate: currentDateString, selectedDate, isCreateModalOpen } = useAppSelector(state => state.calendar);
  const currentDate = new Date(currentDateString);
  const { items: visits, loading: visitsLoading } = useAppSelector(state => state.visits);
  const { items: leads, loading: leadsLoading } = useAppSelector(state => state.leads);
  const { items: properties, loading: propertiesLoading } = useAppSelector(state => state.properties);

  // Los datos se cargan automáticamente al inicializar la aplicación
  // No necesitamos cargar datos aquí

  const handleVisitCreated = () => {
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
    dispatch(setCreateModalOpen(true));
  };

  const handleCreateVisit = () => {
    dispatch(setCreateModalOpen(true));
  };

  const handleCloseModal = () => {
    dispatch(setCreateModalOpen(false));
    dispatch(setSelectedDate(null));
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
    return visits.filter(visit => {
      const visitDate = new Date(visit.VisitAt).toISOString().split('T')[0];
      return visitDate === dateString;
    });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-md">
            <Calendar size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Calendario de Visitas</h1>
            <p className="text-lg text-slate-600">Gestiona y programa visitas a propiedades</p>
          </div>
        </div>
        <Button 
          variant="primary"
          onClick={handleCreateVisit}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Nueva Visita
        </Button>
      </div>

      {/* Stats Cards - Movidos arriba */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Visitas</p>
              <p className="text-xl font-bold text-slate-900">{visits.length}</p>
            </div>
            <Calendar size={20} className="text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Confirmadas</p>
              <p className="text-xl font-bold text-slate-900">
                {visits.filter(v => v.Confirmed).length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock size={16} className="text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pendientes</p>
              <p className="text-xl font-bold text-slate-900">
                {visits.filter(v => !v.Confirmed).length}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={16} className="text-yellow-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Este Mes</p>
              <p className="text-xl font-bold text-slate-900">
                {visits.filter(v => {
                  const visitDate = new Date(v.VisitAt);
                  return visitDate.getMonth() === currentDate.getMonth() && 
                         visitDate.getFullYear() === currentDate.getFullYear();
                }).length}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar size={16} className="text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Calendar Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handlePreviousMonth}>
              <ChevronLeft size={20} />
            </Button>
            <h2 className="text-xl font-bold text-slate-900">{formatDate(currentDate)}</h2>
            <Button variant="ghost" onClick={handleNextMonth}>
              <ChevronRight size={20} />
            </Button>
          </div>
          <Button variant="secondary" onClick={handleToday}>
            Hoy
          </Button>
        </div>

        {/* Calendar Grid - Más compacto */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="p-2 text-center font-semibold text-slate-600 text-sm">
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
                className={`min-h-[80px] p-1 border border-slate-200 cursor-pointer transition-colors ${
                  day.isCurrentMonth 
                    ? 'bg-white hover:bg-slate-50' 
                    : 'bg-slate-50 text-slate-400'
                } ${
                  day.isToday 
                    ? 'ring-2 ring-blue-500' 
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
                <div className="text-xs font-medium mb-1">
                  {day.date.getDate()}
                </div>
                
                {/* Visits for this day - Más compacto */}
                <div className="space-y-0.5">
                  {dayVisits.slice(0, 1).map((visit) => {
                    const lead = getLeadInfo(visit.LeadId);
                    const property = getPropertyInfo(visit.PropertyId);
                    
                    return (
                      <div
                        key={visit.VisitAt}
                        className={`p-1 rounded text-xs ${
                          visit.Confirmed 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Clock size={8} />
                          {formatTime(visit.VisitAt)}
                        </div>
                        <div className="truncate text-xs">
                          {lead?.LeadId?.slice(0, 8) || 'Lead N/A'}
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