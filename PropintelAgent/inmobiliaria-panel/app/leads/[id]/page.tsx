import { Admin } from '@/lib/api';
import Link from 'next/link';
import { LeadProfile } from '@/components/leads/LeadProfile';
import { MessagesList } from '@/components/leads/MessagesList';
import { VisitsTable } from '@/components/leads/VisitsTable';
import { ChatSection } from '@/components/leads/ChatSection';
import { SuggestedProperties } from '@/components/leads/SuggestedProperties';
import { LeadActivity } from '@/components/leads/LeadActivity';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, User, MessageSquare, Calendar, Phone, MapPin, DollarSign } from 'lucide-react';

export default async function LeadDetail({ params }: { params: { id: string } }) {
  const leadId = decodeURIComponent(params.id);
  
  try {
    const [lead, messages, visits] = await Promise.all([
      Admin.lead(leadId),
      Admin.messages(leadId),
      Admin.visitsByLead(leadId),
    ]);

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="md">
              <Link href="/leads" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                <ArrowLeft size={18} />
                Volver a Leads
              </Link>
            </Button>
            <div className="h-8 w-px bg-slate-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Lead: {leadId}</h1>
              <p className="text-slate-600">Detalles completos del lead</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 hover-lift animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Estado</p>
                <p className="text-2xl font-bold text-slate-900">{lead.Status}</p>
              </div>
              <div className="p-3 bg-gradient-primary rounded-xl shadow-medium">
                <User size={24} className="text-white" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 hover-lift animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Mensajes</p>
                <p className="text-2xl font-bold text-slate-900">{messages.items?.length || 0}</p>
              </div>
              <div className="p-3 bg-gradient-success rounded-xl shadow-medium">
                <MessageSquare size={24} className="text-white" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 hover-lift animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Visitas</p>
                <p className="text-2xl font-bold text-slate-900">{visits.items?.length || 0}</p>
              </div>
              <div className="p-3 bg-gradient-warning rounded-xl shadow-medium">
                <Calendar size={24} className="text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-lift animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Presupuesto</p>
                <p className="text-2xl font-bold text-slate-900">
                  {lead.Budget ? `$${lead.Budget.toLocaleString()}` : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-gradient-secondary rounded-xl shadow-medium">
                <DollarSign size={24} className="text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Info */}
        <Card className="p-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Phone size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Contacto</p>
                <p className="text-slate-900 font-semibold">{leadId}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Barrio Preferido</p>
                <p className="text-slate-900 font-semibold">{lead.Neighborhood || 'No especificado'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Intención</p>
                <p className="text-slate-900 font-semibold">{lead.Intent || 'No especificada'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <LeadProfile lead={lead} />
            <LeadActivity lead={lead} messages={messages.items || []} visits={visits.items || []} />
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            <ChatSection leadId={leadId} messages={messages.items || []} />
            <SuggestedProperties lead={lead} />
          </div>
        </div>

        {/* Additional Sections */}
        <div className="space-y-6">
          <VisitsTable visits={visits.items || []} />
          <MessagesList messages={messages.items || []} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-slate-200">
          <Button variant="primary" size="lg" className="flex items-center gap-2">
            <Phone size={18} />
            Llamar Lead
          </Button>
          <Button variant="success" size="lg" className="flex items-center gap-2">
            <MessageSquare size={18} />
            Enviar Mensaje
          </Button>
          <Button variant="secondary" size="lg" className="flex items-center gap-2">
            <Calendar size={18} />
            Programar Visita
          </Button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching lead details:', error);
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="md">
            <Link href="/leads" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft size={18} />
              Volver a Leads
            </Link>
          </Button>
          <div className="h-8 w-px bg-slate-300"></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lead: {leadId}</h1>
          </div>
        </div>
        
        <Card className="text-center py-12 animate-fade-in">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Error al cargar los datos</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              No se pudieron cargar los detalles del lead. Verifica que el ID sea correcto.
            </p>
            <Button asChild variant="primary">
              <Link href="/leads">Volver a la lista</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }
}
