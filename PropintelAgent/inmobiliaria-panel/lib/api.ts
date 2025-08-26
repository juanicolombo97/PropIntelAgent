import { Lead, Property, Message, Visit, ApiResponse, CreatePropertyData } from './types';

const API_BASE = '/api';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...init?.headers,
    };

    console.log('🌐 API Request:', {
      url: `${API_BASE}${path}`,
      method: init?.method || 'GET',
      hasCredentials: true,
      headers: headers
    });

    const res = await fetch(`${API_BASE}${path}`, { 
      cache: "no-store", 
      credentials: 'include', // Incluir cookies de autenticación
      ...init,
      headers,
    });
    
    console.log('📡 API Response:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      url: res.url
    });
    
    if (!res.ok) {
      const text = await res.text();
      console.error('❌ API Error Response:', text);
      throw new Error(`${res.status} ${res.statusText}: ${text}`);
    }
    
    const data = await res.json();
    console.log('✅ API Success:', data);
    return data;
  } catch (error) {
    console.error('💥 API Error:', error);
    throw error;
  }
}

export const Admin = {
  // Leads
  leadsByStatus: (status: "NEW" | "QUALIFIED"): Promise<ApiResponse<Lead>> =>
    req(`/admin/leads?status=${status}`),
    
  lead: (lead_id: string): Promise<Lead> =>
    req(`/admin/lead?lead_id=${encodeURIComponent(lead_id)}`),
    
  createLead: (leadData: {
    LeadId: string;
    Phone: string;
    Intent: string;
    Neighborhood?: string;
    Rooms?: number;
    Budget?: number;
    Status: string;
    Stage?: string;
    Notes?: string;
    CreatedAt: string;
    UpdatedAt: string;
  }): Promise<{ ok: boolean; id: string }> =>
    req(`/admin/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData),
    }),
    
  // Messages
  messages: (lead_id: string, limit: number = 50): Promise<ApiResponse<Message>> =>
    req(`/admin/messages?lead_id=${encodeURIComponent(lead_id)}&limit=${limit}`),
    
  // Properties
  properties: (neighborhood?: string): Promise<ApiResponse<Property>> =>
    req(`/admin/properties${neighborhood ? `?neighborhood=${encodeURIComponent(neighborhood)}` : ""}`),
    
  createProperty: (item: CreatePropertyData): Promise<{ ok: boolean; id: string }> =>
    req(`/admin/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    }),
    
  updateProperty: (id: string, fields: Partial<Property>): Promise<{ ok: boolean }> =>
    req(`/admin/properties/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    }),
    
  // Visits
  visitsByLead: (lead_id: string): Promise<ApiResponse<Visit>> =>
    req(`/admin/visits?lead_id=${encodeURIComponent(lead_id)}`),
    
  visitsByProperty: (property_id: string): Promise<ApiResponse<Visit>> =>
    req(`/admin/visits?property_id=${encodeURIComponent(property_id)}`),
    
  createVisit: (visitData: {
    LeadId: string;
    VisitAt: string;
    PropertyId: string;
    Confirmed?: boolean;
  }): Promise<{ ok: boolean; id: string }> =>
    req(`/admin/visits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visitData),
    }),
    
  confirmVisit: (lead_id: string, visit_at: string, confirmed: boolean): Promise<{ ok: boolean }> =>
    req(`/admin/visits/confirm?lead_id=${encodeURIComponent(lead_id)}&visit_at=${encodeURIComponent(visit_at)}&confirmed=${confirmed}`, {
      method: "PUT",
    }),
};
