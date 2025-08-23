'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  Home, 
  Eye, 
  Calendar, 
  MessageSquare,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Lead } from '@/lib/types';

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

interface SuggestedProperty {
  propertyId: string;
  title: string;
  neighborhood: string;
  rooms: number;
  price: number;
  matchScore: number;
  status: string;
  features: string[];
  lastUpdated: string;
}

export function LeadDetailModal({ isOpen, onClose, lead }: LeadDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'suggested' | 'activity'>('overview');
  const [suggestedProperties, setSuggestedProperties] = useState<SuggestedProperty[]>([]);
  const [loading, setLoading] = useState(false);

  // Simular datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && lead) {
      setLoading(true);
      // Simular llamada a API
      setTimeout(() => {
        setSuggestedProperties([
          {
            propertyId: 'PROP-001',
            title: 'Departamento 2 ambientes luminoso',
            neighborhood: 'Palermo',
            rooms: 2,
            price: 280000,
            matchScore: 95,
            status: 'ACTIVE',
            features: ['Balcón', 'Cocina integrada', 'Piso alto'],
            lastUpdated: '2025-01-15T10:30:00Z'
          },
          {
            propertyId: 'PROP-015',
            title: 'PH 2 ambientes con patio',
            neighborhood: 'Palermo',
            rooms: 2,
            price: 260000,
            matchScore: 88,
            status: 'ACTIVE',
            features: ['Patio', 'Cocina separada', 'Planta baja'],
            lastUpdated: '2025-01-14T16:20:00Z'
          },
          {
            propertyId: 'PROP-008',
            title: 'Departamento 2 ambientes moderno',
            neighborhood: 'Palermo',
            rooms: 2,
            price: 300000,
            matchScore: 82,
            status: 'ACTIVE',
            features: ['Balcón', 'Cocina americana', 'Piso medio'],
            lastUpdated: '2025-01-13T09:15:00Z'
          }
        ]);
        setLoading(false);
      }, 1000);
    }
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <Badge variant="warning" size="sm">Nuevo</Badge>;
      case 'QUALIFIED':
        return <Badge variant="success" size="sm">Calificado</Badge>;
      case 'DISQUALIFIED':
        return <Badge variant="danger" size="sm">Descalificado</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    return 'text-yellow-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200">
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <User size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900">Lead: {lead.LeadId}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Phone size={14} />
                    <span>{lead.LeadId}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{lead.Neighborhood || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign size={14} />
                    <span>{lead.Budget ? `$${lead.Budget.toLocaleString()}` : 'No especificado'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(lead.Status)}
                  <span className="text-xs text-slate-500">Creado: {lead.CreatedAt ? formatDate(lead.CreatedAt) : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex">
            {[
              { id: 'overview', label: 'Vista General', icon: Eye },
              { id: 'suggested', label: 'Propiedades Sugeridas', icon: Home },
              { id: 'activity', label: 'Actividad', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'suggested' | 'activity')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.id === 'suggested' && (
                  <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {suggestedProperties.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Cargando información...</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Estado</p>
                          <p className="text-2xl font-bold text-slate-900">{lead.Status}</p>
                        </div>
                        <User size={24} className="text-blue-500" />
                      </div>
                    </Card>
                    
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Intención</p>
                          <p className="text-2xl font-bold text-slate-900">{lead.Intent || 'No especificada'}</p>
                        </div>
                        <Eye size={24} className="text-green-500" />
                      </div>
                    </Card>
                    
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Presupuesto</p>
                          <p className="text-2xl font-bold text-slate-900">
                            {lead.Budget ? `$${lead.Budget.toLocaleString()}` : 'N/A'}
                          </p>
                        </div>
                        <DollarSign size={24} className="text-purple-500" />
                      </div>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Información del Lead">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Barrio Preferido</p>
                            <p className="font-semibold text-slate-900">{lead.Neighborhood || 'No especificado'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Habitaciones</p>
                            <p className="font-semibold text-slate-900">{lead.Rooms || 'No especificado'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Etapa</p>
                            <p className="font-semibold text-slate-900">{lead.Stage || 'Nueva'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Propiedad Pendiente</p>
                            <p className="font-semibold text-slate-900">{lead.PendingPropertyId || 'Ninguna'}</p>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card title="Resumen de Actividad">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-sm text-green-800">Propiedades Sugeridas</span>
                          </div>
                          <span className="font-bold text-green-800">
                            {suggestedProperties.length}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-blue-600" />
                            <span className="text-sm text-blue-800">Visitas Programadas</span>
                          </div>
                          <span className="font-bold text-blue-800">0</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="text-yellow-600" />
                            <span className="text-sm text-yellow-800">Última Actividad</span>
                          </div>
                          <span className="font-bold text-yellow-800">
                            {lead.UpdatedAt ? formatDate(lead.UpdatedAt) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* Suggested Properties Tab */}
              {activeTab === 'suggested' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Propiedades Sugeridas ({suggestedProperties.length})
                    </h3>
                    <Button variant="primary" size="sm">
                      <Plus size={16} className="mr-2" />
                      Ver Todas las Propiedades
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {suggestedProperties.map((property) => (
                      <Card key={property.propertyId} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-slate-900">{property.title}</h4>
                              <div className={`px-2 py-1 text-xs font-medium rounded-full ${getMatchScoreColor(property.matchScore)}`}>
                                {property.matchScore}% Match
                              </div>
                              <Badge variant={property.status === 'ACTIVE' ? 'success' : 'default'} size="sm">
                                {property.status}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                              <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                <span>{property.neighborhood}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Home size={14} />
                                <span>{property.rooms} ambientes</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign size={14} />
                                <span>${property.price.toLocaleString()}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              {property.features.map((feature, index) => (
                                <span key={index} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                                  {feature}
                                </span>
                              ))}
                            </div>
                            
                            <p className="text-xs text-slate-500">
                              Actualizado: {formatDate(property.lastUpdated)}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye size={14} className="mr-1" />
                              Ver Detalle
                            </Button>
                            <Button variant="primary" size="sm">
                              <Calendar size={14} className="mr-1" />
                              Programar Visita
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900">Actividad Reciente</h3>
                  
                  <Card className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Plus size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Lead creado</p>
                          <p className="text-xs text-slate-600">Se agregó al sistema</p>
                          <p className="text-xs text-slate-500">{lead.CreatedAt ? formatDate(lead.CreatedAt) : 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Eye size={16} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Propiedades sugeridas</p>
                          <p className="text-xs text-slate-600">Se encontraron {suggestedProperties.length} propiedades que coinciden</p>
                          <p className="text-xs text-slate-500">Hace 2 horas</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="primary">
            <MessageSquare size={16} className="mr-2" />
            Contactar Lead
          </Button>
        </div>
      </div>
    </div>
  );
} 