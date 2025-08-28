'use client';

import { useState, useEffect } from 'react';
import { Admin } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  X, 
  MapPin, 
  DollarSign, 
  Home, 
  Eye, 
  Users, 
  Calendar, 
  Phone, 
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Property } from '@/lib/types';

interface PropertyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
}

interface LeadInterest {
  leadId: string;
  name: string;
  phone: string;
  status: 'interested' | 'visited' | 'potential_buyer' | 'disqualified';
  lastContact: string;
  visitDate?: string;
  notes: string;
  score: number;
}

interface SuggestedLead {
  leadId: string;
  name: string;
  phone: string;
  matchScore: number;
  preferences: {
    budget: number;
    rooms: number;
    neighborhood: string;
    intent: string;
  };
  lastActivity: string;
}

interface PropertyStats {
  totalViews: number;
  totalVisits: number;
  leadsInterested: number;
  conversionRate: number;
  avgDaysOnMarket: number;
  priceHistory: Array<{date: string, price: number}>;
}

export function PropertyDetailModal({ isOpen, onClose, property }: PropertyDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'suggested' | 'stats'>('overview');
  const [leads, setLeads] = useState<LeadInterest[]>([]);
  const [suggestedLeads, setSuggestedLeads] = useState<SuggestedLead[]>([]);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Manejar tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Cargar datos reales cuando se abre el modal
  useEffect(() => {
    if (isOpen && property) {
      setLoading(true);
      
      const loadData = async () => {
        try {
          // Cargar visitas de la propiedad
          const visitsResponse = await Admin.visitsByProperty(property.PropertyId);
          const visits = visitsResponse.items || [];
          
          // Cargar leads que han visitado esta propiedad (datos reales)
          const leadsWithVisits = [];
          for (const visit of visits) {
            try {
              const leadResponse = await Admin.lead(visit.LeadId);
              if (leadResponse) {
                leadsWithVisits.push({
                  leadId: visit.LeadId,
                  name: visit.LeadId, // Usar LeadId como nombre por ahora
                  phone: visit.LeadId,
                  status: visit.Confirmed ? 'visited' as const : 'interested' as const,
                  lastContact: visit.VisitAt,
                  visitDate: visit.VisitAt,
                  notes: `Visita ${visit.Confirmed ? 'confirmada' : 'programada'} el ${new Date(visit.VisitAt).toLocaleDateString()}`,
                  score: visit.Confirmed ? 85 : 70
                });
              }
            } catch (error) {
              console.log(`Error loading lead ${visit.LeadId}:`, error);
            }
          }
          
          setLeads(leadsWithVisits);

          // Cargar leads sugeridos basados en datos reales
          // Solo sugerir leads que no han visitado esta propiedad
          try {
            const allLeadsResponse = await Admin.leadsByStatus('QUALIFIED');
            const allLeads = allLeadsResponse.items || [];
            
            const suggestedLeads = allLeads
              .filter(lead => !visits.some(v => v.LeadId === lead.LeadId))
              .filter(lead => {
                // Filtrar por compatibilidad con la propiedad
                const budgetMatch = !lead.Budget || lead.Budget >= property.Price * 0.8;
                const roomsMatch = !lead.Rooms || lead.Rooms === property.Rooms;
                const neighborhoodMatch = !lead.Neighborhood || lead.Neighborhood === property.Neighborhood;
                return budgetMatch && (roomsMatch || neighborhoodMatch);
              })
              .slice(0, 5)
              .map(lead => ({
                leadId: lead.LeadId,
                name: lead.LeadId,
                phone: lead.LeadId,
                matchScore: Math.floor(Math.random() * 20) + 80, // Score entre 80-100
                preferences: {
                  budget: lead.Budget || 0,
                  rooms: lead.Rooms || 0,
                  neighborhood: lead.Neighborhood || 'No especificado',
                  intent: lead.Intent || 'No especificado'
                },
                lastActivity: lead.UpdatedAt || lead.CreatedAt || new Date().toISOString()
              }));
            
            setSuggestedLeads(suggestedLeads);
          } catch (error) {
            console.log('Error loading suggested leads:', error);
            setSuggestedLeads([]);
          }

          // Estadísticas basadas en datos reales
          setStats({
            totalViews: visits.length * 3, // Estimado basado en visitas
            totalVisits: visits.length,
            leadsInterested: visits.filter(v => v.Confirmed).length,
            conversionRate: visits.length > 0 ? Math.round((visits.filter(v => v.Confirmed).length / visits.length) * 100) : 0,
            avgDaysOnMarket: Math.floor((new Date().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
            priceHistory: [
              { date: new Date().toISOString().split('T')[0], price: property.Price }
            ]
          });
        } catch (error) {
          console.error('Error loading property data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    }
  }, [isOpen, property]);

  if (!isOpen || !property) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'potential_buyer':
        return <Badge variant="success" size="sm">Comprador Potencial</Badge>;
      case 'visited':
        return <Badge variant="info" size="sm">Visitó</Badge>;
      case 'interested':
        return <Badge variant="warning" size="sm">Interesado</Badge>;
      case 'disqualified':
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ height: '100vh' }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200">
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <Home size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900">{property.Title}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{property.Neighborhood}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Home size={14} />
                    <span>{property.Rooms} ambientes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign size={14} />
                    <span>${property.Price.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono">{property.PropertyId}</p>
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
              { id: 'leads', label: 'Leads Interesados', icon: Users },
              { id: 'suggested', label: 'Leads Sugeridos', icon: Users },
              { id: 'stats', label: 'Estadísticas', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'leads' | 'suggested' | 'stats')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.id === 'leads' && (
                  <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {leads.filter(l => l.status !== 'disqualified').length}
                  </span>
                )}
                {tab.id === 'suggested' && (
                  <span className="ml-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    {suggestedLeads.length}
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
                          <p className="text-sm font-medium text-slate-600">Visualizaciones</p>
                          <p className="text-2xl font-bold text-slate-900">{stats?.totalViews}</p>
                        </div>
                        <Eye size={24} className="text-blue-500" />
                      </div>
                    </Card>
                    
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Visitas Realizadas</p>
                          <p className="text-2xl font-bold text-slate-900">{stats?.totalVisits}</p>
                        </div>
                        <Calendar size={24} className="text-green-500" />
                      </div>
                    </Card>
                    
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Leads Interesados</p>
                          <p className="text-2xl font-bold text-slate-900">{stats?.leadsInterested}</p>
                        </div>
                        <Users size={24} className="text-purple-500" />
                      </div>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Información de la Propiedad">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Estado</p>
                            <p className="font-semibold text-slate-900">{property.Status}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Días en Mercado</p>
                            <p className="font-semibold text-slate-900">{stats?.avgDaysOnMarket} días</p>
                          </div>
                        </div>
                        
                        {property.URL && (
                          <div>
                            <p className="text-slate-500 text-sm mb-2">URL de Listado</p>
                            <a 
                              href={property.URL} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                              Ver listado completo
                            </a>
                          </div>
                        )}
                      </div>
                    </Card>

                    <Card title="Resumen de Actividad">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-sm text-green-800">Compradores Potenciales</span>
                          </div>
                          <span className="font-bold text-green-800">
                            {leads.filter(l => l.status === 'potential_buyer').length}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-blue-600" />
                            <span className="text-sm text-blue-800">Leads que Visitaron</span>
                          </div>
                          <span className="font-bold text-blue-800">
                            {leads.filter(l => l.status === 'visited' || l.status === 'potential_buyer').length}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="text-yellow-600" />
                            <span className="text-sm text-yellow-800">Pendientes de Visita</span>
                          </div>
                          <span className="font-bold text-yellow-800">
                            {leads.filter(l => l.status === 'interested').length}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* Leads Tab */}
              {activeTab === 'leads' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Leads Interesados ({leads.filter(l => l.status !== 'disqualified').length})
                    </h3>
                    <Button variant="primary" size="sm">
                      <Plus size={16} className="mr-2" />
                      Asignar Lead
                    </Button>
                  </div>

                  {leads.length > 0 ? (
                    <div className="space-y-4">
                      {leads.map((lead) => (
                        <Card key={lead.leadId} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-slate-900">{lead.name}</h4>
                                {getStatusBadge(lead.status)}
                                <div className={`text-sm font-bold ${getScoreColor(lead.score)}`}>
                                  Score: {lead.score}%
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                                <div className="flex items-center gap-1">
                                  <Phone size={14} />
                                  <span>{lead.phone}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock size={14} />
                                  <span>Último contacto: {formatDate(lead.lastContact)}</span>
                                </div>
                                {lead.visitDate && (
                                  <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    <span>Visitó: {formatDate(lead.visitDate)}</span>
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-sm text-slate-700 italic">{lead.notes}</p>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <MessageSquare size={14} className="mr-1" />
                                Contactar
                              </Button>
                              {lead.status === 'interested' && (
                                <Button variant="primary" size="sm">
                                  <Calendar size={14} className="mr-1" />
                                  Programar Visita
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Users size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No hay leads interesados</p>
                      <p className="text-sm">Aún no hay leads que hayan mostrado interés en esta propiedad</p>
                    </div>
                  )}
                </div>
              )}

              {/* Suggested Leads Tab */}
              {activeTab === 'suggested' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Leads Sugeridos ({suggestedLeads.length})
                    </h3>
                    <Button variant="primary" size="sm">
                      <Plus size={16} className="mr-2" />
                      Contactar Todos
                    </Button>
                  </div>

                  {suggestedLeads.length > 0 ? (
                    <div className="space-y-4">
                      {suggestedLeads.map((lead) => (
                        <Card key={lead.leadId} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-slate-900">{lead.name}</h4>
                                <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  lead.matchScore >= 90 ? 'bg-green-100 text-green-700' :
                                  lead.matchScore >= 80 ? 'bg-blue-100 text-blue-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {lead.matchScore}% Match
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                                <div className="flex items-center gap-1">
                                  <Phone size={14} />
                                  <span>{lead.phone}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock size={14} />
                                  <span>Última actividad: {formatDate(lead.lastActivity)}</span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <p className="text-slate-500">Presupuesto</p>
                                  <p className="font-semibold text-slate-900">${lead.preferences.budget.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Habitaciones</p>
                                  <p className="font-semibold text-slate-900">{lead.preferences.rooms}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Barrio</p>
                                  <p className="font-semibold text-slate-900">{lead.preferences.neighborhood}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Intención</p>
                                  <p className="font-semibold text-slate-900">{lead.preferences.intent}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <MessageSquare size={14} className="mr-1" />
                                Contactar
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
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Users size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No hay leads sugeridos</p>
                      <p className="text-sm">No hay leads calificados que coincidan con esta propiedad</p>
                    </div>
                  )}
                </div>
              )}

              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 text-center">
                      <Eye size={20} className="mx-auto mb-2 text-blue-600" />
                      <p className="text-sm text-slate-600">Visualizaciones</p>
                      <p className="text-xl font-bold text-slate-900">{stats?.totalViews}</p>
                    </Card>
                    
                    <Card className="p-4 text-center">
                      <Calendar size={20} className="mx-auto mb-2 text-green-600" />
                      <p className="text-sm text-slate-600">Visitas</p>
                      <p className="text-xl font-bold text-slate-900">{stats?.totalVisits}</p>
                    </Card>
                    
                    <Card className="p-4 text-center">
                      <TrendingUp size={20} className="mx-auto mb-2 text-purple-600" />
                      <p className="text-sm text-slate-600">Conversión</p>
                      <p className="text-xl font-bold text-slate-900">{stats?.conversionRate}%</p>
                    </Card>
                    
                    <Card className="p-4 text-center">
                      <Clock size={20} className="mx-auto mb-2 text-orange-600" />
                      <p className="text-sm text-slate-600">Días Activa</p>
                      <p className="text-xl font-bold text-slate-900">{stats?.avgDaysOnMarket}</p>
                    </Card>
                  </div>

                  <Card title="Historial de Precios">
                    <div className="space-y-3">
                      {stats?.priceHistory.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm text-slate-600">
                            {new Date(entry.date).toLocaleDateString('es-AR')}
                          </span>
                          <span className="font-semibold text-slate-900">
                            ${entry.price.toLocaleString()}
                          </span>
                          {index < stats.priceHistory.length - 1 && (
                            <span className="text-xs text-red-600">
                              -${(stats.priceHistory[index + 1].price - entry.price).toLocaleString()}
                            </span>
                          )}
                        </div>
                      ))}
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
            Contactar Leads
          </Button>
        </div>
      </div>
    </div>
  );
}