import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '../../../../config/api';

export async function GET(request: NextRequest) {
  try {
    // Llamar al bot real para obtener leads existentes (Lambda)
    const BOT_WEBHOOK_URL = API_CONFIG.LAMBDA_API_URL;
    
    try {
      const response = await fetch(`${BOT_WEBHOOK_URL}/admin/leads`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          leads: data.items || []
        });
      }
    } catch (error) {
      console.log('Bot real no disponible, usando datos de ejemplo:', error.message);
    }

    // Fallback: datos de ejemplo
    return NextResponse.json({
      success: true,
      leads: [
        { LeadId: 'demo_user_001', Status: 'NEW', CreatedAt: '2024-01-15T10:00:00Z' },
        { LeadId: 'test_user_002', Status: 'QUALIFIED', CreatedAt: '2024-01-14T15:30:00Z' },
        { LeadId: '+54911234567', Status: 'NEW', CreatedAt: '2024-01-13T09:15:00Z' }
      ]
    });

  } catch (error) {
    console.error('Error obteniendo leads:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
