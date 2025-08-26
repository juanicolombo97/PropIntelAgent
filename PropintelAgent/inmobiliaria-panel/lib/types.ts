export interface Lead {
  LeadId: string;
  Status: "NEW" | "QUALIFIED";
  Intent?: string;
  Rooms?: number;
  Budget?: number;
  Neighborhood?: string;
  Missing?: string[];
  Stage?: string | null;
  PendingPropertyId?: string | null;
  LastSuggestions?: string[];
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