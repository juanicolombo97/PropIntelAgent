import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Admin } from '@/lib/api';
import { Property } from '@/lib/types';

interface PropertiesState {
  items: Property[];
  loading: boolean;
  error: string | null;
  selectedProperty: Property | null;
}

const initialState: PropertiesState = {
  items: [],
  loading: false,
  error: null,
  selectedProperty: null,
};

// Async thunks
export const fetchAllProperties = createAsyncThunk(
  'properties/fetchAll',
  async () => {
    const response = await Admin.getAllProperties();
    return response.items || [];
  }
);

export const fetchPropertiesByNeighborhood = createAsyncThunk(
  'properties/fetchByNeighborhood',
  async (neighborhood: string) => {
    const response = await Admin.properties(neighborhood);
    return response.items || [];
  }
);

export const createProperty = createAsyncThunk(
  'properties/create',
  async (propertyData: any) => {
    const response = await Admin.createProperty(propertyData);
    return response;
  }
);

const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setSelectedProperty: (state, action: PayloadAction<Property | null>) => {
      state.selectedProperty = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addProperty: (state, action: PayloadAction<Property>) => {
      state.items.push(action.payload);
    },
    updateProperty: (state, action: PayloadAction<Property>) => {
      const index = state.items.findIndex(property => property.PropertyId === action.payload.PropertyId);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAllProperties
      .addCase(fetchAllProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAllProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar propiedades';
      })
      // fetchPropertiesByNeighborhood
      .addCase(fetchPropertiesByNeighborhood.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPropertiesByNeighborhood.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPropertiesByNeighborhood.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar propiedades';
      })
      // createProperty
      .addCase(createProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProperty.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al crear propiedad';
      });
  },
});

export const { setSelectedProperty, clearError, addProperty, updateProperty } = propertiesSlice.actions;
export default propertiesSlice.reducer; 