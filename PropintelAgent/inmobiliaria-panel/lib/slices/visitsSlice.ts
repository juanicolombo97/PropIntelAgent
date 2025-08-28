import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Admin } from '@/lib/api';
import { Visit } from '@/lib/types';

interface VisitsState {
  items: Visit[];
  loading: boolean;
  error: string | null;
  selectedVisit: Visit | null;
}

const initialState: VisitsState = {
  items: [],
  loading: false,
  error: null,
  selectedVisit: null,
};

// Async thunks
export const fetchAllVisits = createAsyncThunk(
  'visits/fetchAll',
  async () => {
    const response = await Admin.getAllVisits();
    return response.items || [];
  }
);

export const fetchVisitsByLead = createAsyncThunk(
  'visits/fetchByLead',
  async (leadId: string) => {
    const response = await Admin.visitsByLead(leadId);
    return response.items || [];
  }
);

export const fetchVisitsByProperty = createAsyncThunk(
  'visits/fetchByProperty',
  async (propertyId: string) => {
    const response = await Admin.visitsByProperty(propertyId);
    return response.items || [];
  }
);

export const createVisit = createAsyncThunk(
  'visits/create',
  async (visitData: any) => {
    const response = await Admin.createVisit(visitData);
    return response;
  }
);

export const confirmVisit = createAsyncThunk(
  'visits/confirm',
  async ({ leadId, visitAt, confirmed }: { leadId: string; visitAt: string; confirmed: boolean }) => {
    const response = await Admin.confirmVisit(leadId, visitAt, confirmed);
    return response;
  }
);

const visitsSlice = createSlice({
  name: 'visits',
  initialState,
  reducers: {
    setSelectedVisit: (state, action: PayloadAction<Visit | null>) => {
      state.selectedVisit = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addVisit: (state, action: PayloadAction<Visit>) => {
      state.items.push(action.payload);
    },
    updateVisit: (state, action: PayloadAction<Visit>) => {
      const index = state.items.findIndex(visit => 
        visit.LeadId === action.payload.LeadId && 
        visit.VisitAt === action.payload.VisitAt
      );
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAllVisits
      .addCase(fetchAllVisits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllVisits.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        console.log('✅ Visitas cargadas:', action.payload.length, 'items:', action.payload);
      })
      .addCase(fetchAllVisits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar visitas';
      })
      // fetchVisitsByLead
      .addCase(fetchVisitsByLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisitsByLead.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchVisitsByLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar visitas';
      })
      // fetchVisitsByProperty
      .addCase(fetchVisitsByProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisitsByProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchVisitsByProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar visitas';
      })
      // createVisit
      .addCase(createVisit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVisit.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ Visita creada, respuesta:', action.payload);
        // Nota: Necesitamos hacer fetchAllVisits para actualizar la lista
      })
      .addCase(createVisit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al crear visita';
        console.error('❌ Error creando visita:', action.error);
      })
      // confirmVisit
      .addCase(confirmVisit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmVisit.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(confirmVisit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al confirmar visita';
      });
  },
});

export const { setSelectedVisit, clearError, addVisit, updateVisit } = visitsSlice.actions;
export default visitsSlice.reducer; 