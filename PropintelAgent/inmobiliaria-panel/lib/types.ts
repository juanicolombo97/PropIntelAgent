export interface Lead {
  LeadId: string;
  FullName?: string;
  Phone?: string;
  Status: "NUEVO" | "CALIFICANDO" | "CALIFICADO" | "AGENDANDO_VISITA" | "PROCESO_COMPLETADO";
  Stage: "PRECALIFICACION" | "CALIFICACION" | "POST_CALIFICACION" | "FINALIZADO";
  Intent?: string;
  Rooms?: number;
  Budget?: number;
  Neighborhood?: string;
  PropertyId?: string;
  QualificationData?: {
    property_confirmed: boolean;
    buyer_confirmed: boolean;
    motive_confirmed: boolean;
    timeline_confirmed: boolean;
    financing_confirmed: boolean;
    ready_to_close: boolean;
    needs_to_sell?: boolean;
    has_preapproval?: boolean;
    decision_maker: boolean;
  };
  Missing?: string[];
  PendingPropertyId?: string | null;
  LastSuggestions?: string[];
  Notes?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface Message {
  LeadId: string;
  Timestamp: string;
  Direction: 'in' | 'out';
  Text: string;
}

export interface Property {
  PropertyId: string;
  Title: string;
  Neighborhood: string;
  Rooms: number;
  Price: number;
  Status: 'ACTIVE' | 'INACTIVE' | 'SOLD';
  URL?: string;
}

export interface Visit {
  LeadId: string;
  VisitAt: string;
  PropertyId: string;
  Confirmed: boolean;
  Notes?: string;
  CreatedAt?: string;
}

export interface ApiResponse<T> {
  items: T[];
  count?: number;
}

export interface CreatePropertyData {
  PropertyId: string;
  Title: string;
  Neighborhood: string;
  Rooms: number;
  Price: number;
  Status: 'ACTIVE';
  URL?: string;
} 