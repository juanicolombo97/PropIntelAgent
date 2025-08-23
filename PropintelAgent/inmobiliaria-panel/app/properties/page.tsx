'use client';

import { useState, useEffect } from 'react';
import { Admin } from '@/lib/api';
import { PropertiesTable } from '@/components/properties/PropertiesTable';
import { CreatePropertyModal } from '@/components/properties/CreatePropertyModal';
import { PropertyDetailModal } from '@/components/properties/PropertyDetailModal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Building2, Plus, DollarSign, Home, Filter } from 'lucide-react';
import { Property } from '@/lib/types';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const data = await Admin.properties();
      setProperties(data.items || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyCreated = () => {
    loadProperties();
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setIsDetailModalOpen(true);
  };

  const totalProperties = properties.length;
  const activeProperties = properties.filter(p => p.Status === 'ACTIVE').length;
  const averagePrice = properties.length 
    ? Math.round(properties.reduce((sum, p) => sum + p.Price, 0) / properties.length)
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

      {/* Properties Management */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Lista de Propiedades</h2>
            <p className="text-slate-600">Gestiona tu inventario inmobiliario</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="md">
              <Filter size={18} className="mr-2" />
              Filtrar
            </Button>
            <Button 
              variant="primary" 
              size="md"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={18} className="mr-2" />
              Cargar Propiedad
            </Button>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando propiedades...</p>
          </div>
        ) : (
          <PropertiesTable 
            properties={properties} 
            onPropertyClick={handlePropertyClick}
          />
        )}
      </div>

      {/* Modals */}
      <CreatePropertyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPropertyCreated={handlePropertyCreated}
      />

      <PropertyDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        property={selectedProperty}
      />

      {/* Empty State */}
      {!loading && !properties.length && (
        <Card className="text-center py-12">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Building2 size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">No hay propiedades aún</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Comienza agregando tu primera propiedad para crear tu catálogo inmobiliario
            </p>
            <Button 
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Agregar Primera Propiedad
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
