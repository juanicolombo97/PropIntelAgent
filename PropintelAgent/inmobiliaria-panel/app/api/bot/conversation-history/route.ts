import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '../../../../config/api';
import { getConversation, clearConversation } from '../conversation-state';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phone_number');

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Llamar al bot real para obtener historial (Lambda)
    const BOT_WEBHOOK_URL = API_CONFIG.LAMBDA_API_URL;
    
    try {
      const response = await fetch(`${BOT_WEBHOOK_URL}/admin/messages?lead_id=${phoneNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Obtener información del lead
        const leadResponse = await fetch(`${BOT_WEBHOOK_URL}/admin/lead?lead_id=${phoneNumber}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        let leadInfo = {};
        if (leadResponse.ok) {
          leadInfo = await leadResponse.json();
        }

        return NextResponse.json({
          success: true,
          history: data.items || [],
          leadInfo: leadInfo
        });
      }
    } catch (error) {
      console.log('Bot real no disponible, usando datos de ejemplo:', error.message);
    }

    // Fallback: datos de ejemplo
    return NextResponse.json({
      success: true,
      history: [
        {
          role: 'user',
          content: 'Hola buenas'
        },
        {
          role: 'assistant', 
          content: 'Para ayudarte mejor, me decis si estás buscando para alquilar o comprar?'
        }
      ],
      leadInfo: {
        LeadId: phoneNumber,
        Status: 'NEW',
        Intent: null,
        Rooms: null,
        Budget: null,
        Neighborhood: null,
        Missing: ['Intent', 'Rooms', 'Budget', 'Neighborhood']
      }
    });

  } catch (error) {
    console.error('Error en bot conversation-history:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Agregar endpoint DELETE para limpiar conversación
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phone_number');

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Limpiar conversación
    clearConversation(phoneNumber);

    return NextResponse.json({
      success: true,
      message: 'Conversación limpiada'
    });

  } catch (error) {
    console.error('Error en bot clear conversation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
