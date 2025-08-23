import { Admin } from '@/lib/api';
import { PropertiesTable } from '@/components/properties/PropertiesTable';
import { CreatePropertyForm } from '@/components/properties/CreatePropertyForm';
import { PropertyFilter } from '@/components/properties/PropertyFilter';
import { Card } from '@/components/ui/Card';
import { Building2, Plus, DollarSign, Home } from 'lucide-react';

async function getData(neighborhood?: string) {
  try {
    return await Admin.properties(neighborhood);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return { items: [] };
  }
}

export default async function PropertiesPage({ 
  searchParams 
}: { 
  searchParams: { neighborhood?: string } 
}) {
  const neighborhood = searchParams?.neighborhood;
  const data = await getData(neighborhood);

  const totalProperties = data.items?.length || 0;
  const activeProperties = data.items?.filter(p => p.Status === 'ACTIVE').length || 0;
  const averagePrice = data.items?.length 
    ? Math.round(data.items.reduce((sum, p) => sum + p.Price, 0) / data.items.length)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-md">
            <Building2 size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Catálogo de Propiedades</h1>
            <p className="text-lg text-slate-600">Gestiona tu inventario inmobiliario de manera eficiente</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Total Propiedades</p>
              <p className="text-3xl font-bold text-slate-900">{totalProperties}</p>
              <p className="text-sm text-slate-500">En el catálogo</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-md">
              <Home size={28} className="text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Propiedades Activas</p>
              <p className="text-3xl font-bold text-slate-900">{activeProperties}</p>
              <p className="text-sm text-slate-500">Disponibles para venta</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-md">
              <Building2 size={28} className="text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Precio Promedio</p>
              <p className="text-3xl font-bold text-slate-900">
                ${averagePrice.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">Valor promedio</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl shadow-md">
              <DollarSign size={28} className="text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Section */}
      <PropertyFilter />

      {/* Create Property Form */}
      <CreatePropertyForm />

      {/* Properties Table */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Lista de Propiedades</h2>
            <p className="text-slate-600">Gestiona tu inventario inmobiliario</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-md transition-all duration-200">
            <Plus size={18} />
            Agregar Propiedad
          </button>
        </div>
        <PropertiesTable properties={data.items || []} />
      </div>

      {/* Empty State */}
      {!data.items?.length && (
        <Card className="text-center py-12">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Building2 size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">No hay propiedades aún</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Comienza agregando tu primera propiedad para crear tu catálogo inmobiliario
            </p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-md transition-all duration-200">
              <Plus size={18} />
              Agregar Primera Propiedad
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
