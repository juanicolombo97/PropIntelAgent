'use client';

import { useState, useEffect } from 'react';
import { Admin } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, MapPin, User, Home } from 'lucide-react';
import { Visit, Lead, Property } from '@/lib/types';
import { CreateVisitModal } from '@/components/calendar/CreateVisitModal';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visits, setVisits] = useState<Visit[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [visitsData, leadsData, propertiesData] = await Promise.all([
        Admin.getAllVisits(),
        Admin.getAllLeads(),
        Admin.getAllProperties(),
      ]);
      
      setVisits(visitsData.items || []);
      setLeads(leadsData.items || []);
      setProperties(propertiesData.items || []);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVisitCreated = () => {
    loadData();
  };

  // Funciones para navegación del calendario
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
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
    <div className="space-y-8">
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
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Nueva Visita
        </Button>
      </div>

      {/* Calendar Navigation */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={goToPreviousMonth}>
              <ChevronLeft size={20} />
            </Button>
            <h2 className="text-2xl font-bold text-slate-900">{formatDate(currentDate)}</h2>
            <Button variant="ghost" onClick={goToNextMonth}>
              <ChevronRight size={20} />
            </Button>
          </div>
          <Button variant="secondary" onClick={goToToday}>
            Hoy
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="p-3 text-center font-semibold text-slate-600 text-sm">
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
                className={`min-h-[120px] p-2 border border-slate-200 cursor-pointer transition-colors ${
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
                    setSelectedDate(day.date);
                    setIsCreateModalOpen(true);
                  }
                }}
              >
                <div className="text-sm font-medium mb-1">
                  {day.date.getDate()}
                </div>
                
                {/* Visits for this day */}
                <div className="space-y-1">
                  {dayVisits.slice(0, 2).map((visit) => {
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
                          <Clock size={10} />
                          {formatTime(visit.VisitAt)}
                        </div>
                        <div className="truncate">
                          {lead?.LeadId || 'Lead N/A'}
                        </div>
                        <div className="truncate text-xs opacity-75">
                          {property?.Title || 'Propiedad N/A'}
                        </div>
                      </div>
                    );
                  })}
                  
                  {dayVisits.length > 2 && (
                    <div className="text-xs text-slate-500 text-center">
                      +{dayVisits.length - 2} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Visitas</p>
              <p className="text-2xl font-bold text-slate-900">{visits.length}</p>
            </div>
            <Calendar size={24} className="text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Confirmadas</p>
              <p className="text-2xl font-bold text-slate-900">
                {visits.filter(v => v.Confirmed).length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock size={20} className="text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pendientes</p>
              <p className="text-2xl font-bold text-slate-900">
                {visits.filter(v => !v.Confirmed).length}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Este Mes</p>
              <p className="text-2xl font-bold text-slate-900">
                {visits.filter(v => {
                  const visitDate = new Date(v.VisitAt);
                  return visitDate.getMonth() === currentDate.getMonth() && 
                         visitDate.getFullYear() === currentDate.getFullYear();
                }).length}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar size={20} className="text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Create Visit Modal */}
      <CreateVisitModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedDate(null);
        }}
        onVisitCreated={handleVisitCreated}
        selectedDate={selectedDate}
        leads={leads}
        properties={properties}
      />
    </div>
  );
}