'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, X, Upload, MapPin, Home, FileText } from 'lucide-react';

interface CreatePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyCreated?: () => void;
}

export function CreatePropertyModal({ isOpen, onClose, onPropertyCreated }: CreatePropertyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    PropertyId: '',
    Title: '',
    Neighborhood: '',
    Rooms: '',
    Price: '',
    URL: '',
    Description: '',
    Address: '',
    Features: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        PropertyId: formData.PropertyId,
        Title: formData.Title,
        Neighborhood: formData.Neighborhood,
        Rooms: parseInt(formData.Rooms) || 0,
        Price: parseInt(formData.Price) || 0,
        Status: 'ACTIVE' as const,
        URL: formData.URL || '',
        Description: formData.Description || '',
        Address: formData.Address || '',
        Features: formData.Features || ''
      };

      const response = await Admin.createProperty(payload);

      // Reset form
      setFormData({
        PropertyId: '',
        Title: '',
        Neighborhood: '',
        Rooms: '',
        Price: '',
        URL: '',
        Description: '',
        Address: '',
        Features: ''
      });
      
      onPropertyCreated?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la propiedad');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 min-h-screen">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
              <Plus size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Nueva Propiedad</h2>
              <p className="text-sm text-slate-600">Agregar una nueva propiedad al catálogo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Home size={18} className="text-blue-600" />
              Información Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="PropertyId"
                label="ID de Propiedad *"
                placeholder="Ej: PROP-001"
                value={formData.PropertyId}
                onChange={handleInputChange}
                required
                size="md"
              />
              
              <Input
                name="Title"
                label="Título *"
                placeholder="Ej: Departamento 2 ambientes luminoso"
                value={formData.Title}
                onChange={handleInputChange}
                required
                size="md"
              />
              
              <Input
                name="Rooms"
                label="Habitaciones *"
                type="number"
                placeholder="2"
                min="1"
                value={formData.Rooms}
                onChange={handleInputChange}
                required
                size="md"
              />
              
              <Input
                name="Price"
                label="Precio (USD) *"
                type="number"
                placeholder="150000"
                min="0"
                step="1000"
                value={formData.Price}
                onChange={handleInputChange}
                required
                size="md"
              />
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-green-600" />
              Ubicación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="Neighborhood"
                label="Barrio *"
                placeholder="Ej: Palermo"
                value={formData.Neighborhood}
                onChange={handleInputChange}
                required
                size="md"
              />
              
              <Input
                name="Address"
                label="Dirección"
                placeholder="Ej: Av. Santa Fe 1234"
                value={formData.Address}
                onChange={handleInputChange}
                size="md"
              />
            </div>
          </div>

          {/* Detalles */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-purple-600" />
              Detalles Adicionales
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="Description"
                  rows={3}
                  placeholder="Descripción detallada de la propiedad..."
                  value={formData.Description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Características
                </label>
                <textarea
                  name="Features"
                  rows={2}
                  placeholder="Ej: Balcón, Cocina integrada, Piso alto, Luminoso..."
                  value={formData.Features}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              
              <Input
                name="URL"
                label="URL de Listado"
                type="url"
                placeholder="https://..."
                value={formData.URL}
                onChange={handleInputChange}
                size="md"
              />
            </div>
          </div>

          {/* Fotos */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Upload size={18} className="text-orange-600" />
              Fotos (Próximamente)
            </h3>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
              <Upload size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="text-slate-500">Funcionalidad de carga de fotos próximamente</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              {isSubmitting ? 'Creando...' : 'Crear Propiedad'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}