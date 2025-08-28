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
    // Obtener leads de ambos estados y combinarlos
    const [newLeads, qualifiedLeads] = await Promise.all([
      Admin.leadsByStatus('NEW'),
      Admin.leadsByStatus('QUALIFIED')
    ]);
    
    const allLeads = [
      ...(newLeads.items || []),
      ...(qualifiedLeads.items || [])
    ];
    
    return allLeads;
  }
);

export const fetchLeadsByStatus = createAsyncThunk(
  'leads/fetchByStatus',
  async (status: 'NEW' | 'QUALIFIED') => {
    const response = await Admin.leadsByStatus(status);
    return response.items || [];
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