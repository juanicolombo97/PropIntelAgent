'use client';

import { useAppSelector } from '@/lib/hooks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  TrendingUp, 
  Users, 
  Home, 
  Calendar, 
  DollarSign, 
  MapPin, 
  MessageSquare,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const { items: leads, loading: leadsLoading } = useAppSelector((state: any) => state.leads);
  const { items: properties, loading: propertiesLoading } = useAppSelector((state: any) => state.properties);
  const { items: visits, loading: visitsLoading } = useAppSelector((state: any) => state.visits);

  // Los datos se cargan automáticamente al inicializar la aplicación
  // No necesitamos cargar datos aquí

  const loading = leadsLoading || propertiesLoading || visitsLoading;

  // Métricas clave
  const keyMetrics = {
    totalLeads: leads.length,
    totalProperties: properties.length,
    totalVisits: visits.length,
    confirmedVisits: visits.filter((v: any) => v.Confirmed).length,
    avgPropertyPrice: properties.length > 0 
      ? Math.round(properties.reduce((sum: number, p: any) => sum + p.Price, 0) / properties.length)
      : 0,
    conversionRate: leads.length > 0 
      ? Math.round((visits.length / leads.length) * 100)
      : 0
  };

  // Conversaciones recientes (últimos leads)
  const recentConversations = [...leads]
    .sort((a: any, b: any) => new Date(b.UpdatedAt || '').getTime() - new Date(a.UpdatedAt || '').getTime())
    .slice(0, 5);

  // Actividad reciente (últimas visitas)
  const recentActivity = [...visits]
    .sort((a: any, b: any) => new Date(b.VisitAt).getTime() - new Date(a.VisitAt).getTime())
    .slice(0, 5);

  // Estadísticas de visitas por zona
  const visitStats = properties.map((property: any) => ({
    neighborhood: property.Neighborhood,
    visits: visits.filter((v: any) => v.PropertyId === property.PropertyId).length,
    avgDays: Math.floor(Math.random() * 30) + 15, // Simulado
    demand: Math.floor(Math.random() * 20) + 5 // Simulado
  }));

  // Análisis por tipo de departamento
  const typeStats = properties.reduce((acc: any, property: any) => {
    const type = property.Rooms <= 1 ? 'Monoambiente' : 
                 property.Rooms === 2 ? '2 Ambientes' :
                 property.Rooms === 3 ? '3 Ambientes' : '4+ Ambientes';
    
    if (!acc[type]) acc[type] = { count: 0, avgPrice: 0, totalPrice: 0 };
    acc[type].count++;
    acc[type].totalPrice += property.Price;
    acc[type].avgPrice = Math.round(acc[type].totalPrice / acc[type].count);
    
    return acc;
  }, {} as Record<string, { count: number; avgPrice: number; totalPrice: number }>);

  // Métricas de eficiencia
  const performanceStats = {
    avgResponseTime: Math.floor(Math.random() * 24) + 2, // Horas
    leadQualificationRate: Math.round((leads.filter((l: any) => l.Status === 'CALIFICADO').length / leads.length) * 100) || 0,
    visitConfirmationRate: visits.length > 0 ? Math.round((visits.filter((v: any) => v.Confirmed).length / visits.length) * 100) : 0,
    avgDaysToClose: Math.floor(Math.random() * 45) + 30 // Días
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-md">
              <TrendingUp size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-lg text-slate-600">Vista general de tu negocio inmobiliario</p>
            </div>
          </div>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-md">
            <TrendingUp size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-lg text-slate-600">Vista general de tu negocio inmobiliario</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Leads</p>
              <p className="text-2xl font-bold text-slate-900">{keyMetrics.totalLeads}</p>
            </div>
            <Users size={24} className="text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Propiedades</p>
              <p className="text-2xl font-bold text-slate-900">{keyMetrics.totalProperties}</p>
            </div>
            <Home size={24} className="text-green-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Visitas Programadas</p>
              <p className="text-2xl font-bold text-slate-900">{keyMetrics.totalVisits}</p>
            </div>
            <Calendar size={24} className="text-purple-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Precio Promedio</p>
              <p className="text-2xl font-bold text-slate-900">${keyMetrics.avgPropertyPrice.toLocaleString()}</p>
            </div>
            <DollarSign size={24} className="text-yellow-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Tasa de Conversión</p>
              <p className="text-2xl font-bold text-slate-900">{keyMetrics.conversionRate}%</p>
            </div>
            <TrendingUp size={24} className="text-emerald-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Visitas Confirmadas</p>
              <p className="text-2xl font-bold text-slate-900">{keyMetrics.confirmedVisits}</p>
            </div>
            <CheckCircle size={24} className="text-green-500" />
          </div>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Últimas Conversaciones */}
        <Card title="Últimas Conversaciones">
          <div className="space-y-4">
            {recentConversations.length > 0 ? (
              recentConversations.map((lead: any) => (
                <div key={lead.LeadId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{lead.LeadId}</h4>
                    <p className="text-sm text-slate-600">
                      {lead.Intent || 'Sin intención'} • {lead.Neighborhood || 'Sin barrio'}
                    </p>
                  </div>
                  <Badge variant={lead.Status === 'NUEVO' ? 'warning' : 'success'} size="sm">
                    {lead.Status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay conversaciones</p>
                <p className="text-sm">Aún no se han registrado conversaciones</p>
              </div>
            )}
          </div>
        </Card>

        {/* Análisis de Visitas por Zona */}
        <Card title="Análisis de Visitas por Zona">
          <div className="space-y-4">
            {visitStats.length > 0 ? (
              visitStats.map((stat: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-slate-600" />
                    <div>
                      <h4 className="font-medium text-slate-900">{stat.neighborhood}</h4>
                      <p className="text-sm text-slate-600">{stat.visits} visitas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{stat.avgDays} días</p>
                    <p className="text-xs text-slate-600">Demanda: {stat.demand}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay datos de zonas</p>
                <p className="text-sm">Aún no se han registrado visitas por zona</p>
              </div>
            )}
          </div>
        </Card>

        {/* Análisis por Tipo de Departamento */}
        <Card title="Análisis por Tipo de Departamento">
          <div className="space-y-4">
            {Object.keys(typeStats).length > 0 ? (
                             Object.entries(typeStats).map(([type, stats]: [string, any]) => (
                 <div key={type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                   <div className="flex items-center gap-3">
                     <Home size={16} className="text-slate-600" />
                     <div>
                       <h4 className="font-medium text-slate-900">{type}</h4>
                       <p className="text-sm text-slate-600">{stats.count} propiedades</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-medium text-slate-900">${stats.avgPrice.toLocaleString()}</p>
                     <p className="text-xs text-slate-600">Precio promedio</p>
                   </div>
                 </div>
               ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Home size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay propiedades</p>
                <p className="text-sm">Aún no se han registrado propiedades</p>
              </div>
            )}
          </div>
        </Card>

        {/* Actividad Reciente */}
        <Card title="Actividad Reciente">
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((visit: any) => (
                <div key={`${visit.LeadId}-${visit.VisitAt}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar size={16} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">Visita programada</h4>
                    <p className="text-sm text-slate-600">
                      {new Date(visit.VisitAt).toLocaleDateString('es-AR')} • {visit.LeadId}
                    </p>
                  </div>
                  <Badge variant={visit.Confirmed ? 'success' : 'warning'} size="sm">
                    {visit.Confirmed ? 'Confirmada' : 'Pendiente'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No hay actividad</p>
                <p className="text-sm">Aún no se han registrado actividades</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Métricas de Eficiencia */}
      <Card title="Métricas de Eficiencia">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-3">
              <Clock size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{performanceStats.avgResponseTime}h</h3>
            <p className="text-sm text-slate-600">Tiempo de respuesta promedio</p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-3">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{performanceStats.leadQualificationRate}%</h3>
            <p className="text-sm text-slate-600">Tasa de calificación de leads</p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-yellow-100 rounded-lg w-fit mx-auto mb-3">
              <AlertCircle size={24} className="text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{performanceStats.visitConfirmationRate}%</h3>
            <p className="text-sm text-slate-600">Tasa de confirmación de visitas</p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-3">
              <TrendingUp size={24} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{performanceStats.avgDaysToClose} días</h3>
            <p className="text-sm text-slate-600">Promedio de días para cerrar</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
