import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '../../../../config/api';

export async function GET(request: NextRequest) {
  try {
    // Llamar al bot real para obtener leads existentes (Lambda)
    const BOT_WEBHOOK_URL = API_CONFIG.LAMBDA_API_URL;
    
    try {
      // Obtener leads con diferentes statuses y combinarlos
      const statuses = ['NEW', 'QUALIFIED', 'SCHEDULED', 'COMPLETED'];
      let allLeads: any[] = [];
      
      for (const status of statuses) {
        try {
          const response = await fetch(`${BOT_WEBHOOK_URL}/admin/leads?status=${status}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': API_CONFIG.ADMIN_API_KEY,
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
              allLeads = [...allLeads, ...data.items];
            }
          }
        } catch (error) {
          console.log(`❌ Error obteniendo leads con status ${status}:`, (error as Error).message);
        }
      }

      console.log('✅ Leads obtenidos del bot real:', allLeads);
      return NextResponse.json({
        success: true,
        leads: allLeads
      });

    } catch (error) {
      console.log('❌ Bot real no disponible:', (error as Error).message);
      // Devolver lista vacía en lugar de datos de ejemplo
      return NextResponse.json({
        success: true,
        leads: []
      });
    }

  } catch (error) {
    console.error('Error obteniendo leads:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
