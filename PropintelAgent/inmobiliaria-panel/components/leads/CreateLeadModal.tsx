'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, X, User, MapPin, FileText } from 'lucide-react';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated?: () => void;
}

export function CreateLeadModal({ isOpen, onClose, onLeadCreated }: CreateLeadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    LeadId: '',
    Phone: '',
    Intent: '',
    Neighborhood: '',
    Rooms: '',
    Budget: '',
    Stage: 'NEW',
    Notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
        LeadId: formData.LeadId,
        Phone: formData.Phone,
        Intent: formData.Intent || 'Compra',
        Neighborhood: formData.Neighborhood || '',
        Rooms: formData.Rooms ? parseInt(formData.Rooms) : null,
        Budget: formData.Budget ? parseInt(formData.Budget) : null,
        Status: 'NEW',
        Stage: formData.Stage || 'NEW',
        Notes: formData.Notes || '',
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      };

      const response = await Admin.createLead(payload);

      // Reset form
      setFormData({
        LeadId: '',
        Phone: '',
        Intent: '',
        Neighborhood: '',
        Rooms: '',
        Budget: '',
        Stage: 'NEW',
        Notes: ''
      });
      
      onLeadCreated?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear el lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 min-h-screen">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Plus size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Nuevo Lead</h2>
              <p className="text-sm text-slate-600">Agregar un nuevo prospecto al sistema</p>
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
              <User size={18} className="text-blue-600" />
              Información Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="LeadId"
                label="ID del Lead *"
                placeholder="Ej: +54 11 2345-6789 o email"
                value={formData.LeadId}
                onChange={handleInputChange}
                required
                size="md"
              />
              
              <Input
                name="Phone"
                label="Teléfono *"
                placeholder="Ej: +54 11 2345-6789"
                value={formData.Phone}
                onChange={handleInputChange}
                required
                size="md"
              />
            </div>
          </div>

          {/* Intención y Preferencias */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-green-600" />
              Preferencias de Búsqueda
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Intención *
                </label>
                <select
                  name="Intent"
                  value={formData.Intent}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar intención</option>
                  <option value="Compra">Compra</option>
                  <option value="Alquiler">Alquiler</option>
                  <option value="Inversión">Inversión</option>
                  <option value="Consulta">Consulta</option>
                </select>
              </div>
              
              <Input
                name="Neighborhood"
                label="Barrio Preferido"
                placeholder="Ej: Palermo, Recoleta..."
                value={formData.Neighborhood}
                onChange={handleInputChange}
                size="md"
              />
              
              <Input
                name="Rooms"
                label="Cantidad de Habitaciones"
                type="number"
                placeholder="2"
                min="1"
                max="10"
                value={formData.Rooms}
                onChange={handleInputChange}
                size="md"
              />
              
              <Input
                name="Budget"
                label="Presupuesto (USD)"
                type="number"
                placeholder="150000"
                min="0"
                step="1000"
                value={formData.Budget}
                onChange={handleInputChange}
                size="md"
              />
            </div>
          </div>

          {/* Estado y Notas */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-purple-600" />
              Información Adicional
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Etapa Inicial
                </label>
                <select
                  name="Stage"
                  value={formData.Stage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="NEW">Nuevo</option>
                  <option value="CONTACTED">Contactado</option>
                  <option value="QUALIFIED">Calificado</option>
                  <option value="VISIT_SCHEDULED">Visita Programada</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notas
                </label>
                <textarea
                  name="Notes"
                  rows={3}
                  placeholder="Notas adicionales sobre el lead, preferencias específicas, comentarios..."
                  value={formData.Notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
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
              {isSubmitting ? 'Creando...' : 'Crear Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}