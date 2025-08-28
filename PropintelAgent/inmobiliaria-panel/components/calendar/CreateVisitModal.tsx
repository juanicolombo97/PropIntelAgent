'use client';

import { useState, useEffect } from 'react';
import { Admin } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Clock, User, Home, X, Plus, CheckCircle } from 'lucide-react';
import { Lead, Property } from '@/lib/types';

interface CreateVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVisitCreated?: () => void;
  selectedDate?: Date | null;
  leads: Lead[];
  properties: Property[];
}

export function CreateVisitModal({ 
  isOpen, 
  onClose, 
  onVisitCreated, 
  selectedDate, 
  leads, 
  properties 
}: CreateVisitModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    LeadId: '',
    PropertyId: '',
    VisitAt: '',
    Confirmed: false,
    Notes: ''
  });

  // Reset form when modal opens or selectedDate changes
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const date = selectedDate || now;
      
      // Set default time to next hour
      const nextHour = new Date(date);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      
      setFormData({
        LeadId: '',
        PropertyId: '',
        VisitAt: nextHour.toISOString().slice(0, 16), // Format for datetime-local input
        Confirmed: false,
        Notes: ''
      });
    }
  }, [isOpen, selectedDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        LeadId: formData.LeadId,
        PropertyId: formData.PropertyId,
        VisitAt: new Date(formData.VisitAt).toISOString(),
        Confirmed: formData.Confirmed,
        Notes: formData.Notes || undefined
      };

      await Admin.createVisit(payload);
      
      onVisitCreated?.();
      onClose();
    } catch (error) {
      console.error('Error creating visit:', error);
      alert('Error al crear la visita');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSelectedLead = () => leads.find(lead => lead.LeadId === formData.LeadId);
  const getSelectedProperty = () => properties.find(property => property.PropertyId === formData.PropertyId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Calendar size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Nueva Visita</h2>
              <p className="text-sm text-slate-600">
                {selectedDate ? `Programar para ${formatDate(selectedDate)}` : 'Programar nueva visita'}
              </p>
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
          {/* Date and Time */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-blue-600" />
              Fecha y Hora
            </h3>
            <Input
              name="VisitAt"
              type="datetime-local"
              label="Fecha y Hora de la Visita *"
              value={formData.VisitAt}
              onChange={handleInputChange}
              required
              size="md"
            />
          </div>

          {/* Lead Selection */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User size={18} className="text-green-600" />
              Seleccionar Lead
            </h3>
            <div className="space-y-3">
              <select
                name="LeadId"
                value={formData.LeadId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar un lead</option>
                {leads.map((lead) => (
                  <option key={lead.LeadId} value={lead.LeadId}>
                    {lead.LeadId} - {lead.Intent || 'Sin intención'} - {lead.Neighborhood || 'Sin barrio'}
                  </option>
                ))}
              </select>
              
              {getSelectedLead() && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <User size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900">{getSelectedLead()?.LeadId}</h4>
                      <div className="text-sm text-green-700 space-y-1">
                        <p>Intención: {getSelectedLead()?.Intent || 'No especificada'}</p>
                        <p>Barrio: {getSelectedLead()?.Neighborhood || 'No especificado'}</p>
                        <p>Presupuesto: {getSelectedLead()?.Budget ? `$${getSelectedLead()?.Budget.toLocaleString()}` : 'No especificado'}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Property Selection */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Home size={18} className="text-purple-600" />
              Seleccionar Propiedad
            </h3>
            <div className="space-y-3">
              <select
                name="PropertyId"
                value={formData.PropertyId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar una propiedad</option>
                {properties.map((property) => (
                  <option key={property.PropertyId} value={property.PropertyId}>
                    {property.Title} - {property.Neighborhood} - ${property.Price?.toLocaleString()}
                  </option>
                ))}
              </select>
              
              {getSelectedProperty() && (
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Home size={16} className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-purple-900">{getSelectedProperty()?.Title}</h4>
                      <div className="text-sm text-purple-700 space-y-1">
                        <p>Barrio: {getSelectedProperty()?.Neighborhood}</p>
                        <p>Precio: ${getSelectedProperty()?.Price?.toLocaleString()}</p>
                        <p>Habitaciones: {getSelectedProperty()?.Rooms}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Confirmation Status */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-orange-600" />
              Estado de Confirmación
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="Confirmed"
                checked={formData.Confirmed}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm text-slate-700">
                Visita confirmada por el cliente
              </label>
              {formData.Confirmed && (
                <Badge variant="success" size="sm">
                  Confirmada
                </Badge>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Notas Adicionales</h3>
            <textarea
              name="Notes"
              rows={3}
              placeholder="Notas sobre la visita, instrucciones especiales, comentarios..."
              value={formData.Notes}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
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
              {isSubmitting ? 'Creando...' : 'Crear Visita'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 