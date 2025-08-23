import { Admin } from '@/lib/api';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { Card } from '@/components/ui/Card';
import { Users, TrendingUp, Filter, Search, Plus } from 'lucide-react';

async function fetchData() {
  try {
    const [newLeads, qualifiedLeads] = await Promise.all([
      Admin.leadsByStatus("NEW"),
      Admin.leadsByStatus("QUALIFIED"),
    ]);
    return { newLeads, qualifiedLeads };
  } catch (error) {
    console.error('Error fetching leads:', error);
    return { newLeads: { items: [] }, qualifiedLeads: { items: [] } };
  }
}

export default async function LeadsPage() {
  const { newLeads, qualifiedLeads } = await fetchData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-md">
            <Users size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Gestión de Leads</h1>
            <p className="text-lg text-slate-600">Administra y optimiza tu pipeline de ventas</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Total Leads</p>
              <p className="text-3xl font-bold text-slate-900">
                {(newLeads.items?.length || 0) + (qualifiedLeads.items?.length || 0)}
              </p>
              <p className="text-sm text-slate-500">En el sistema</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-md">
              <Users size={28} className="text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Leads Nuevos</p>
              <p className="text-3xl font-bold text-slate-900">{newLeads.items?.length || 0}</p>
              <p className="text-sm text-slate-500">Pendientes de calificación</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl shadow-md">
              <Filter size={28} className="text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Leads Calificados</p>
              <p className="text-3xl font-bold text-slate-900">{qualifiedLeads.items?.length || 0}</p>
              <p className="text-sm text-slate-500">Listos para venta</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-md">
              <TrendingUp size={28} className="text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Buscar leads..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Todos los estados</option>
              <option>Nuevos</option>
              <option>Calificados</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-md transition-all duration-200">
            <Plus size={18} />
            Nuevo Lead
          </button>
        </div>
      </Card>

      {/* Tables */}
      <div className="space-y-8">
        <LeadsTable leads={newLeads.items || []} title="Leads Nuevos" />
        <LeadsTable leads={qualifiedLeads.items || []} title="Leads Calificados" />
      </div>

      {/* Empty State */}
      {(!newLeads.items?.length && !qualifiedLeads.items?.length) && (
        <Card className="text-center py-12">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Users size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">No hay leads aún</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Comienza agregando tu primer lead para empezar a gestionar tu pipeline de ventas
            </p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-md transition-all duration-200">
              <Plus size={18} />
              Agregar Primer Lead
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
