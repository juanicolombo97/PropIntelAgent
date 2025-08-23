import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Target, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  UserCheck,
  Zap,
  ArrowRight,
  Filter
} from 'lucide-react';

export default function Dashboard() {
  // Métricas clave del negocio
  const keyMetrics = [
    {
      title: 'Visitas Pendientes',
      value: '14',
      subtitle: 'Próximos 7 días',
      change: '+6',
      icon: Calendar,
      color: 'text-blue-600',
      bgGradient: 'from-blue-500 to-indigo-500',
      description: 'Visitas confirmadas y por confirmar'
    },
    {
      title: 'Conversaciones Activas',
      value: '31',
      subtitle: 'En progreso',
      change: '+9',
      icon: Target,
      color: 'text-green-600',
      bgGradient: 'from-green-500 to-emerald-500',
      description: 'Leads en proceso de negociación'
    },
    {
      title: 'Leads Calificados',
      value: '23',
      subtitle: 'Listos para visita',
      change: '+5',
      icon: UserCheck,
      color: 'text-purple-600',
      bgGradient: 'from-purple-500 to-pink-500',
      description: 'Clasificados automáticamente como serios'
    },
    {
      title: 'Visitas Esta Semana',
      value: '18',
      subtitle: 'Total programadas',
      change: '+12',
      icon: Clock,
      color: 'text-orange-600',
      bgGradient: 'from-orange-500 to-red-500',
      description: 'Agenda de la semana actual'
    }
  ];

  // Últimas conversaciones
  const recentConversations = [
    {
      leadName: 'María González',
      lastMessage: 'Perfecto, nos vemos mañana a las 14:30hs',
      time: '15 min',
      status: 'confirmed',
      property: '2 amb Palermo',
      avatar: 'MG'
    },
    {
      leadName: 'Carlos Rodríguez',
      lastMessage: '¿Podemos reprogramar para el viernes?',
      time: '45 min',
      status: 'pending',
      property: '3 amb Recoleta',
      avatar: 'CR'
    },
    {
      leadName: 'Ana López',
      lastMessage: 'Me gustó mucho el departamento, ¿cuándo podemos...',
      time: '2 horas',
      status: 'interested',
      property: '1 amb Belgrano',
      avatar: 'AL'
    },
    {
      leadName: 'Roberto Silva',
      lastMessage: 'Gracias por la información, lo consulto y te aviso',
      time: '4 horas',
      status: 'evaluating',
      property: '2 amb Villa Crespo',
      avatar: 'RS'
    },
    {
      leadName: 'Lucía Fernández',
      lastMessage: '¿Tienen algo similar pero más cerca del subte?',
      time: '6 horas',
      status: 'searching',
      property: '2 amb Palermo',
      avatar: 'LF'
    }
  ];

  // Actividad reciente con contexto de negocio
  const recentActivity = [
    {
      type: 'visit_confirmed',
      title: 'Visita confirmada: María González',
      description: 'Mañana 14:30hs • 2 amb Palermo • $220k',
      time: '30 min',
      icon: CheckCircle,
      color: 'text-green-600',
      priority: 'high'
    },
    {
      type: 'visit_scheduled',
      title: 'Nueva visita: Carlos Rodríguez',
      description: 'Viernes 15:00hs • 3 amb Recoleta',
      time: '1 hora',
      icon: Calendar,
      color: 'text-blue-600',
      priority: 'high'
    },
    {
      type: 'ai_qualification',
      title: 'IA calificó 3 nuevos leads',
      description: 'Todos aptos para visita inmediata',
      time: '2 horas',
      icon: Zap,
      color: 'text-purple-600',
      priority: 'medium'
    },
    {
      type: 'visit_completed',
      title: 'Visita completada: Ana López',
      description: 'Mostró interés alto • Siguiente: propuesta',
      time: '4 horas',
      icon: Target,
      color: 'text-orange-600',
      priority: 'high'
    }
  ];

  // Estadísticas de visitas por zona y tipo
  const visitStats = [
    { zone: 'Palermo', visits: 12, sales: 9, conversion: '75%', avgDays: 15 },
    { zone: 'Recoleta', visits: 8, sales: 5, conversion: '63%', avgDays: 22 },
    { zone: 'Belgrano', visits: 6, sales: 5, conversion: '83%', avgDays: 12 },
    { zone: 'Villa Crespo', visits: 4, sales: 2, conversion: '50%', avgDays: 28 }
  ];

  // Estadísticas por tipo de departamento
  const typeStats = [
    { type: '1 ambiente', visits: 8, sales: 4, conversion: '50%', demand: 'alta' },
    { type: '2 ambientes', visits: 15, sales: 12, conversion: '80%', demand: 'muy alta' },
    { type: '3 ambientes', visits: 7, sales: 5, conversion: '71%', demand: 'media' }
  ];

  // Métricas de eficiencia
  const performanceStats = [
    { label: 'Visitas esta semana', value: '18', trend: 'up', good: true },
    { label: 'Tasa de confirmación', value: '92%', trend: 'up', good: true },
    { label: 'Visitas canceladas', value: '8%', trend: 'down', good: true },
    { label: 'Tiempo hasta venta', value: '16 días', trend: 'down', good: true }
  ];

  return (
    <div className="space-y-8">
      {/* Header del Dashboard */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Dashboard Inmobiliario
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Optimiza tu tiempo enfocándote en leads de calidad y maximiza tus conversiones
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <Clock size={16} />
          <span>Actualizado hace 5 minutos</span>
        </div>
      </div>

      {/* Métricas Clave */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => (
          <Card key={metric.title} className="p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-slate-600">{metric.title}</p>
                <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
                <p className="text-sm text-slate-500">{metric.subtitle}</p>
                <div className="flex items-center gap-1">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-sm text-green-600 font-medium">{metric.change}</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.bgGradient} shadow-md`}>
                <metric.icon size={24} className="text-white" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500">{metric.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Últimas Conversaciones */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Últimas Conversaciones</h2>
        <Card>
          <div className="space-y-4">
            {recentConversations.map((conversation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {conversation.avatar}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-slate-900">{conversation.leadName}</h4>
                    <span className="text-xs text-slate-500">Hace {conversation.time}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-1 truncate">{conversation.lastMessage}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{conversation.property}</span>
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      conversation.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      conversation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      conversation.status === 'interested' ? 'bg-blue-100 text-blue-700' :
                      conversation.status === 'evaluating' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {conversation.status === 'confirmed' ? 'Confirmado' :
                       conversation.status === 'pending' ? 'Pendiente' :
                       conversation.status === 'interested' ? 'Interesado' :
                       conversation.status === 'evaluating' ? 'Evaluando' :
                       'Buscando'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 text-center">
            <Button variant="secondary" size="sm">
              Ver Todas las Conversaciones
            </Button>
          </div>
        </Card>
      </div>

      {/* Análisis de Visitas por Zona */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rendimiento por Zona */}
        <Card title="Visitas por Zona (Última Semana)">
          <div className="space-y-4">
            {visitStats.map((stat, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-900">{stat.zone}</h4>
                  <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                    parseFloat(stat.conversion) >= 70 ? 'bg-green-100 text-green-700' :
                    parseFloat(stat.conversion) >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {stat.conversion}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Visitas</p>
                    <p className="font-semibold text-slate-900">{stat.visits}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Ventas</p>
                    <p className="font-semibold text-green-600">{stat.sales}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Días promedio</p>
                    <p className="font-semibold text-slate-900">{stat.avgDays}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Rendimiento por Tipo */}
        <Card title="Análisis por Tipo de Departamento">
          <div className="space-y-4">
            {typeStats.map((stat, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-900">{stat.type}</h4>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      stat.demand === 'muy alta' ? 'bg-red-100 text-red-700' :
                      stat.demand === 'alta' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      Demanda {stat.demand}
                    </div>
                    <span className="text-sm font-bold text-green-600">{stat.conversion}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Visitas esta semana</p>
                    <p className="font-semibold text-slate-900">{stat.visits}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Ventas cerradas</p>
                    <p className="font-semibold text-green-600">{stat.sales}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Actividad Reciente y Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Actividad Reciente */}
        <Card title="Actividad Reciente">
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className={`p-2 rounded-lg ${
                  activity.priority === 'high' ? 'bg-green-100' :
                  activity.priority === 'medium' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <activity.icon size={16} className={activity.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                  <p className="text-sm text-slate-600">{activity.description}</p>
                  <p className="text-xs text-slate-500 mt-1">Hace {activity.time}</p>
                </div>
                {activity.priority === 'high' && (
                  <div className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                    Urgente
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Métricas de Eficiencia */}
        <Card title="Métricas de Eficiencia">
          <div className="space-y-4">
            {performanceStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900">{stat.label}</p>
                  <p className="text-xs text-slate-500">Últimos 30 días</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} className={stat.good ? 'text-green-500' : 'text-red-500'} />
                    <span className={`text-xs font-medium ${stat.good ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend === 'up' ? 'Mejorando' : 'Optimizando'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                <Users size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Gestión de Leads</h3>
                <p className="text-slate-600 mb-4">
                  Califica nuevos prospectos y optimiza tu pipeline de ventas
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle size={14} className="text-green-500" />
                    <span>Calificación automática por IA</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle size={14} className="text-green-500" />
                    <span>Scoring de calidad de prospect</span>
                  </div>
                </div>
                <Button asChild variant="primary" className="w-full">
                  <a href="/leads" className="flex items-center justify-center gap-2">
                    Ver Leads
                    <ArrowRight size={16} />
                  </a>
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <Building2 size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Catálogo Inmobiliario</h3>
                <p className="text-slate-600 mb-4">
                  Administra tu inventario y optimiza el matching con prospects
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle size={14} className="text-green-500" />
                    <span>Matching inteligente de propiedades</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle size={14} className="text-green-500" />
                    <span>Gestión de precios y disponibilidad</span>
                  </div>
                </div>
                <Button asChild variant="success" className="w-full">
                  <a href="/properties" className="flex items-center justify-center gap-2">
                    Ver Propiedades
                    <ArrowRight size={16} />
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Insights de Visitas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <Target size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Mejor Zona</h3>
            <p className="text-slate-600 mb-4">
              <strong>Belgrano</strong> tiene la mayor tasa de conversión (83%) 
              y cierra ventas en promedio en 12 días.
            </p>
            <Button variant="primary" size="sm">
              Ver Propiedades Belgrano
            </Button>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
              <Zap size={24} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Oportunidad</h3>
            <p className="text-slate-600 mb-4">
              <strong>2 ambientes</strong> tienen demanda muy alta (80% conversión). 
              Enfócate en conseguir más propiedades de este tipo.
            </p>
            <Button variant="success" size="sm">
              Buscar 2 Ambientes
            </Button>
          </div>
        </Card>
      </div>

      {/* Insights Generales */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Eye size={32} className="text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Insights del Sistema IA</h3>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            Los leads auto-calificados por IA tienen 92% de tasa de confirmación de visitas. 
            Las visitas en Belgrano y con departamentos de 2 ambientes son las más exitosas.
            El horario ideal para visitas es entre 14:00 y 17:00hs.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary">
              Ver Análisis Completo
            </Button>
            <Button variant="secondary">
              Configurar Alertas
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
