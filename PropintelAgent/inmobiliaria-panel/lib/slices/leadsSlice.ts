import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Admin } from '@/lib/api';
import { Lead } from '@/lib/types';

interface LeadsState {
  items: Lead[];
  loading: boolean;
  error: string | null;
  selectedLead: Lead | null;
}

const initialState: LeadsState = {
  items: [],
  loading: false,
  error: null,
  selectedLead: null,
};

// Async thunks
export const fetchAllLeads = createAsyncThunk(
  'leads/fetchAll',
  async () => {
    // Usar el endpoint del bot que ya tiene todos los leads con los nuevos estados
    const response = await fetch('/api/bot/leads');
    const data = await response.json();
    
    if (data.success) {
      return data.leads || [];
    } else {
      throw new Error('Error al obtener leads del bot');
    }
  }
);

export const fetchLeadsByStatus = createAsyncThunk(
  'leads/fetchByStatus',
  async (status: 'NUEVO' | 'CALIFICANDO' | 'CALIFICADO' | 'AGENDANDO_VISITA' | 'PROCESO_COMPLETADO') => {
    // Usar el endpoint del bot que ya tiene todos los leads con los nuevos estados
    const response = await fetch('/api/bot/leads');
    const data = await response.json();
    
    if (data.success) {
      // Filtrar por el status específico
      return (data.leads || []).filter((lead: Lead) => lead.Status === status);
    } else {
      throw new Error('Error al obtener leads del bot');
    }
  }
);

export const fetchLeadById = createAsyncThunk(
  'leads/fetchById',
  async (leadId: string) => {
    const response = await Admin.lead(leadId);
    return response;
  }
);

export const createLead = createAsyncThunk(
  'leads/create',
  async (leadData: any) => {
    const response = await Admin.createLead(leadData);
    return response;
  }
);

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setSelectedLead: (state, action: PayloadAction<Lead | null>) => {
      state.selectedLead = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addLead: (state, action: PayloadAction<Lead>) => {
      state.items.push(action.payload);
    },
    updateLead: (state, action: PayloadAction<Lead>) => {
      const index = state.items.findIndex(lead => lead.LeadId === action.payload.LeadId);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAllLeads
      .addCase(fetchAllLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAllLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar leads';
      })
      // fetchLeadsByStatus
      .addCase(fetchLeadsByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeadsByStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchLeadsByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar leads';
      })
      // fetchLeadById
      .addCase(fetchLeadById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeadById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedLead = action.payload;
      })
      .addCase(fetchLeadById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar lead';
      })
      // createLead
      .addCase(createLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLead.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al crear lead';
      });
  },
});

export const { setSelectedLead, clearError, addLead, updateLead } = leadsSlice.actions;
export default leadsSlice.reducer; 