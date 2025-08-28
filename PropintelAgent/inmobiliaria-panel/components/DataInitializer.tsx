'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { fetchAllLeads } from '@/lib/slices/leadsSlice';
import { fetchAllProperties } from '@/lib/slices/propertiesSlice';
import { fetchAllVisits } from '@/lib/slices/visitsSlice';

export function DataInitializer() {
  const dispatch = useAppDispatch();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Solo ejecutar una vez en el cliente
    if (hasInitialized) return;
    
    // Cargar todos los datos al inicializar la aplicación
    console.log('🚀 Inicializando datos de la aplicación...');
    
    const loadAllData = async () => {
      try {
        await Promise.all([
          dispatch(fetchAllLeads()),
          dispatch(fetchAllProperties()),
          dispatch(fetchAllVisits())
        ]);
        console.log('✅ Datos cargados exitosamente');
        setHasInitialized(true);
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
      }
    };

    loadAllData();
  }, [dispatch, hasInitialized]);

  // Este componente no renderiza nada
  return null;
} 