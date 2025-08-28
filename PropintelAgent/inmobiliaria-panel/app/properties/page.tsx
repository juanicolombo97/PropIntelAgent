'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../lib/hooks';
import { fetchAllProperties } from '../../lib/slices/propertiesSlice';
import { PropertiesTable } from '../../components/properties/PropertiesTable';
import { CreatePropertyModal } from '../../components/properties/CreatePropertyModal';
import { PropertyDetailModal } from '../../components/properties/PropertyDetailModal';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Building2, Plus, DollarSign, Home, Filter } from 'lucide-react';

export default function PropertiesPage() {
  const dispatch = useAppDispatch();
  const { items: properties, loading } = useAppSelector((state: any) => state.properties);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  // Los datos se cargan automáticamente al inicializar la aplicación
  // No necesitamos cargar datos aquí

  const handlePropertyCreated = () => {
    dispatch(fetchAllProperties());
  };

  const handlePropertyClick = (property: any) => {
    setSelectedProperty(property);
    setIsDetailModalOpen(true);
  };

  const totalProperties = properties.length;
  const activeProperties = properties.filter((p: any) => p.Status === 'ACTIVE').length;
  const averagePrice = properties.length 
    ? Math.round(properties.reduce((sum: number, p: any) => sum + p.Price, 0) / properties.length)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-md">
            <Building2 size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Catálogo de Propiedades</h1>
            <p className="text-lg text-slate-600">Gestiona tu inventario inmobiliario de manera eficiente</p>
          </div>
        </div>
        <Button 
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Nueva Propiedad
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Propiedades</p>
              <p className="text-2xl font-bold text-slate-900">{totalProperties}</p>
            </div>
            <Home size={24} className="text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Propiedades Activas</p>
              <p className="text-2xl font-bold text-slate-900">{activeProperties}</p>
            </div>
            <Building2 size={24} className="text-green-500" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Precio Promedio</p>
              <p className="text-2xl font-bold text-slate-900">
                ${averagePrice.toLocaleString()}
              </p>
            </div>
            <DollarSign size={24} className="text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Properties Table */}
      <PropertiesTable 
        properties={properties} 
        onPropertyClick={handlePropertyClick}
      />

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
    </div>
  );
}
