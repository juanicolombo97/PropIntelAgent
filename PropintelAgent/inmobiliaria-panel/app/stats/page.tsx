import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BarChart3, TrendingUp, TrendingDown, Calendar, MapPin, Home, Users, Target, Clock } from 'lucide-react';

export default function StatsPage() {
  // Datos de ejemplo para estadísticas
  const conversionStats = [
    { period: 'Enero', visits: 45, sales: 34, conversion: 76 },
    { period: 'Febrero', visits: 52, sales: 38, conversion: 73 },
    { period: 'Marzo', visits: 48, sales: 41, conversion: 85 },
    { period: 'Abril', visits: 38, sales: 29, conversion: 76 }
  ];

  const zonePerformance = [
    { zone: 'Palermo', visits: 78, sales: 59, conversion: 76, avgPrice: 285000, trend: 'up' },
    { zone: 'Recoleta', visits: 45, sales: 28, conversion: 62, avgPrice: 320000, trend: 'down' },
    { zone: 'Belgrano', visits: 32, sales: 27, conversion: 84, avgPrice: 275000, trend: 'up' },
    { zone: 'Villa Crespo', visits: 28, sales: 14, conversion: 50, avgPrice: 195000, trend: 'stable' },
    { zone: 'Barrio Norte', visits: 19, sales: 16, conversion: 84, avgPrice: 350000, trend: 'up' }
  ];

  const propertyTypeStats = [
    { type: '1 ambiente', total: 45, active: 38, sold: 7, avgDays: 22, demand: 'Alta' },
    { type: '2 ambientes', total: 67, active: 52, sold: 15, avgDays: 16, demand: 'Muy Alta' },
    { type: '3 ambientes', total: 34, active: 28, sold: 6, avgDays: 28, demand: 'Media' },
    { type: '4+ ambientes', total: 12, active: 11, sold: 1, avgDays: 45, demand: 'Baja' }
  ];

  const timeAnalysis = [
    { hour: '09:00-11:00', visits: 12, success: 8, rate: 67 },
    { hour: '11:00-13:00', visits: 18, success: 14, rate: 78 },
    { hour: '13:00-15:00', visits: 8, success: 5, rate: 63 },
    { hour: '15:00-17:00', visits: 24, success: 21, rate: 88 },
    { hour: '17:00-19:00', visits: 16, success: 12, rate: 75 },
    { hour: '19:00-21:00', visits: 6, success: 3, rate: 50 }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-md">
            <BarChart3 size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Estadísticas y Análisis</h1>
            <p className="text-lg text-slate-600">Insights detallados para optimizar tu estrategia de ventas</p>
          </div>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <Target size={24} className="mx-auto mb-2 text-blue-600" />
          <p className="text-sm font-medium text-slate-600">Conversión Promedio</p>
          <p className="text-3xl font-bold text-slate-900">77%</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <TrendingUp size={12} className="text-green-500" />
            <span className="text-xs text-green-600">+5% vs mes anterior</span>
          </div>
        </Card>

        <Card className="p-6 text-center">
          <Calendar size={24} className="mx-auto mb-2 text-green-600" />
          <p className="text-sm font-medium text-slate-600">Tiempo Promedio Venta</p>
          <p className="text-3xl font-bold text-slate-900">23</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <TrendingDown size={12} className="text-green-500" />
            <span className="text-xs text-green-600">-3 días vs anterior</span>
          </div>
        </Card>

        <Card className="p-6 text-center">
          <Users size={24} className="mx-auto mb-2 text-purple-600" />
          <p className="text-sm font-medium text-slate-600">Leads Calificados</p>
          <p className="text-3xl font-bold text-slate-900">89%</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <TrendingUp size={12} className="text-green-500" />
            <span className="text-xs text-green-600">+12% vs anterior</span>
          </div>
        </Card>

        <Card className="p-6 text-center">
          <Clock size={24} className="mx-auto mb-2 text-orange-600" />
          <p className="text-sm font-medium text-slate-600">Mejor Horario</p>
          <p className="text-xl font-bold text-slate-900">15-17hs</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-xs text-orange-600">88% éxito</span>
          </div>
        </Card>
      </div>

      {/* Conversión por Mes */}
      <Card title="Evolución de Conversiones">
        <div className="space-y-4">
          {conversionStats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-slate-900 w-20">{stat.period}</div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-slate-500">Visitas: </span>
                    <span className="font-semibold text-slate-900">{stat.visits}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Ventas: </span>
                    <span className="font-semibold text-green-600">{stat.sales}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900">{stat.conversion}%</div>
                <div className="w-32 bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${stat.conversion}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Rendimiento por Zona */}
      <Card title="Análisis por Zona">
        <div className="space-y-4">
          {zonePerformance.map((zone, index) => (
            <div key={index} className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-slate-500" />
                  <h3 className="font-semibold text-slate-900">{zone.zone}</h3>
                  <div className={`px-2 py-1 text-xs rounded-full ${
                    zone.trend === 'up' ? 'bg-green-100 text-green-700' :
                    zone.trend === 'down' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {zone.trend === 'up' ? '↗ Subiendo' :
                     zone.trend === 'down' ? '↘ Bajando' : '→ Estable'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">{zone.conversion}%</div>
                  <div className="text-xs text-slate-500">conversión</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Visitas</p>
                  <p className="font-semibold text-slate-900">{zone.visits}</p>
                </div>
                <div>
                  <p className="text-slate-500">Ventas</p>
                  <p className="font-semibold text-green-600">{zone.sales}</p>
                </div>
                <div>
                  <p className="text-slate-500">Precio Prom.</p>
                  <p className="font-semibold text-slate-900">${zone.avgPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">ROI</p>
                  <p className="font-semibold text-blue-600">
                    ${(zone.sales * zone.avgPrice * 0.03).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Análisis por Tipo de Propiedad y Horarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tipo de Propiedad */}
        <Card title="Rendimiento por Tipo">
          <div className="space-y-4">
            {propertyTypeStats.map((type, index) => (
              <div key={index} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Home size={14} className="text-slate-500" />
                    <span className="font-medium text-slate-900">{type.type}</span>
                  </div>
                  <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                    type.demand === 'Muy Alta' ? 'bg-red-100 text-red-700' :
                    type.demand === 'Alta' ? 'bg-orange-100 text-orange-700' :
                    type.demand === 'Media' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {type.demand}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Total</p>
                    <p className="font-semibold">{type.total}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Activas</p>
                    <p className="font-semibold text-blue-600">{type.active}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Vendidas</p>
                    <p className="font-semibold text-green-600">{type.sold}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Días prom.</p>
                    <p className="font-semibold">{type.avgDays}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Análisis por Horario */}
        <Card title="Efectividad por Horario">
          <div className="space-y-3">
            {timeAnalysis.map((time, index) => (
              <div key={index} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-900">{time.hour}</span>
                  <span className={`text-sm font-bold ${
                    time.rate >= 80 ? 'text-green-600' :
                    time.rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {time.rate}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{time.visits} visitas</span>
                  <span>{time.success} exitosas</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                  <div 
                    className={`h-1.5 rounded-full ${
                      time.rate >= 80 ? 'bg-green-500' :
                      time.rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${time.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Acciones Recomendadas */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="text-center py-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Recomendaciones del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-white rounded-lg">
              <div className="text-blue-600 font-semibold mb-2">🎯 Enfoque Horario</div>
              <p className="text-slate-600">Programa más visitas entre 15:00-17:00hs (88% éxito)</p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <div className="text-green-600 font-semibold mb-2">📍 Zona Prioritaria</div>
              <p className="text-slate-600">Belgrano y Barrio Norte muestran 84% de conversión</p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <div className="text-purple-600 font-semibold mb-2">🏠 Tipo Demandado</div>
              <p className="text-slate-600">2 ambientes: alta demanda, tiempo de venta rápido</p>
            </div>
          </div>
          <Button variant="primary" className="mt-4">
            Descargar Reporte Completo
          </Button>
        </div>
      </Card>
    </div>
  );
}