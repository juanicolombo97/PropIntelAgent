'use client';

import { useState, useEffect } from 'react';
import { Admin } from '@/lib/api';
import Link from 'next/link';
import { ChatSection } from '@/components/leads/ChatSection';
import { SuggestedProperties } from '@/components/leads/SuggestedProperties';
import { LeadActivity } from '@/components/leads/LeadActivity';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, User, MessageSquare, Calendar, Phone, MapPin, DollarSign, Eye, Home, TrendingUp, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { Lead, Message, Visit } from '@/lib/types';

export default function LeadDetail({ params }: { params: { id: string } }) {
  const leadId = decodeURIComponent(params.id);
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<{ items: Message[] }>({ items: [] });
  const [visits, setVisits] = useState<{ items: Visit[] }>({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'suggested' | 'activity' | 'chat'>('overview');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [leadData, messagesData, visitsData] = await Promise.all([
          Admin.lead(leadId),
          Admin.messages(leadId),
          Admin.visitsByLead(leadId),
        ]);
        
        setLead(leadData);
        setMessages(messagesData);
        setVisits(visitsData);
      } catch (err) {
        console.error('Error fetching lead details:', err);
        console.error('Error type:', typeof err);
        console.error('Error string:', String(err));
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [leadId]);

  // Funciones auxiliares (copiadas del modal)
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-slate-200">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <User size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900">Lead: {leadId}</h2>
                  <p className="text-slate-600 mt-1">Cargando detalles...</p>
                </div>
              </div>
            </div>
            <Button asChild variant="ghost" size="md">
              <Link href="/leads" className="flex items-center gap-2">
                <ArrowLeft size={18} />
                Volver a Leads
              </Link>
            </Button>
          </div>
          
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando detalles del lead...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-slate-200">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
                  <User size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900">Lead: {leadId}</h2>
                  <p className="text-red-600 mt-1">Error al cargar</p>
                </div>
              </div>
            </div>
            <Button asChild variant="ghost" size="md">
              <Link href="/leads" className="flex items-center gap-2">
                <ArrowLeft size={18} />
                Volver a Leads
              </Link>
            </Button>
          </div>
          
          <div className="p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <User size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Error al cargar los datos</h3>
            <p className="text-slate-600 max-w-md mx-auto mt-2">
              No se pudieron cargar los detalles del lead. 
              {process.env.NODE_ENV === 'development' && error && (
                <><br />Error: {String(error)}</>
              )}
            </p>
            <Button asChild variant="primary" className="mt-4">
              <Link href="/leads">Volver a la lista</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-xl">
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
          <Button asChild variant="ghost" size="md">
            <Link href="/leads" className="flex items-center gap-2">
              <ArrowLeft size={18} />
              Volver a Leads
            </Link>
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex">
            {[
              { id: 'overview', label: 'Vista General', icon: Eye },
              { id: 'suggested', label: 'Propiedades Sugeridas', icon: Home },
              { id: 'activity', label: 'Actividad', icon: TrendingUp },
              { id: 'chat', label: 'Historial de Conversaciones', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'suggested' | 'activity' | 'chat')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.id === 'chat' && (
                  <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {messages.items?.length || 0}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
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
                        <span className="text-sm text-green-800">Mensajes</span>
                      </div>
                      <span className="font-bold text-green-800">
                        {messages.items?.length || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-blue-600" />
                        <span className="text-sm text-blue-800">Visitas Programadas</span>
                      </div>
                      <span className="font-bold text-blue-800">{visits.items?.length || 0}</span>
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
              <h3 className="text-lg font-semibold text-slate-900">
                Propiedades Sugeridas
              </h3>
              <SuggestedProperties lead={lead} />
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">Actividad Reciente</h3>
              <LeadActivity lead={lead} messages={messages.items || []} visits={visits.items || []} />
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">Historial de Conversaciones</h3>
              <ChatSection leadId={leadId} messages={messages.items || []} />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <Button variant="secondary">
            <Phone size={16} className="mr-2" />
            Llamar Lead
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