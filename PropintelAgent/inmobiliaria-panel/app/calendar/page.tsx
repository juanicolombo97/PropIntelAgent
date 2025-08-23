import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock, MapPin, User, Plus, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  // Datos de ejemplo para las visitas
  const visits = [
    {
      id: 1,
      time: '10:00',
      duration: '45 min',
      client: 'María González',
      phone: '+54 11 2345-6789',
      property: 'PROP-001',
      address: '2 amb - Palermo',
      status: 'confirmed',
      notes: 'Interesada en mudanza urgente'
    },
    {
      id: 2,
      time: '14:30',
      duration: '60 min',
      client: 'Carlos Rodríguez',
      phone: '+54 11 3456-7890',
      property: 'PROP-015',
      address: '3 amb - Recoleta',
      status: 'pending',
      notes: 'Primera visita, viene con pareja'
    },
    {
      id: 3,
      time: '16:00',
      duration: '30 min',
      client: 'Ana López',
      phone: '+54 11 4567-8901',
      property: 'PROP-008',
      address: '1 amb - Belgrano',
      status: 'confirmed',
      notes: 'Busca inversión'
    }
  ];

  const stats = [
    { label: 'Visitas hoy', value: '3', color: 'text-blue-600' },
    { label: 'Esta semana', value: '18', color: 'text-green-600' },
    { label: 'Pendientes', value: '6', color: 'text-yellow-600' },
    { label: 'Confirmadas', value: '12', color: 'text-purple-600' }
  ];

  return (
    <div className="space-y-8">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4 text-center">
            <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Calendar Navigation */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <ChevronLeft size={16} />
            </Button>
            <h2 className="text-xl font-bold text-slate-900">Miércoles, 15 de Enero 2025</h2>
            <Button variant="ghost" size="sm">
              <ChevronRight size={16} />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm">
              <Filter size={16} className="mr-2" />
              Filtrar
            </Button>
            <Button variant="primary" size="sm">
              <Plus size={16} className="mr-2" />
              Nueva Visita
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {visits.map((visit) => (
            <div key={visit.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="flex-shrink-0 text-center">
                <div className="text-lg font-bold text-slate-900">{visit.time}</div>
                <div className="text-xs text-slate-500">{visit.duration}</div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <User size={14} />
                      {visit.client}
                    </h3>
                    <p className="text-xs text-slate-500">{visit.phone}</p>
                  </div>
                  <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                    visit.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    visit.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {visit.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{visit.address}</span>
                  </div>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-xs">{visit.property}</span>
                </div>
                
                {visit.notes && (
                  <p className="text-sm text-slate-500 italic">{visit.notes}</p>
                )}
              </div>
              
              <div className="flex-shrink-0 flex gap-2">
                <Button variant="ghost" size="sm">
                  Editar
                </Button>
                <Button variant="secondary" size="sm">
                  Contactar
                </Button>
              </div>
            </div>
          ))}
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
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => (
          <Card key={day} className={`p-3 ${index === 2 ? 'ring-2 ring-purple-500 bg-purple-50' : ''}`}>
            <div className="text-center">
              <div className="text-xs font-medium text-slate-600">{day}</div>
              <div className="text-lg font-bold text-slate-900">{13 + index}</div>
              <div className="text-xs text-slate-500 mt-2">
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