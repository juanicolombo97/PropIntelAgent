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
      // Obtener mensajes del bot real
      const messagesResponse = await fetch(`${BOT_WEBHOOK_URL}/admin/messages?lead_id=${phoneNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_CONFIG.ADMIN_API_KEY,
        }
      });

      // Obtener información del lead
      const leadResponse = await fetch(`${BOT_WEBHOOK_URL}/admin/lead?lead_id=${phoneNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_CONFIG.ADMIN_API_KEY,
        }
      });

      // Verificar si hay mensajes pendientes en la tabla de debounce
      const pendingMessagesResponse = await fetch(`${BOT_WEBHOOK_URL}/admin/pending-messages?lead_id=${phoneNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_CONFIG.ADMIN_API_KEY,
        }
      });

      let leadInfo = {};
      let history = [];
      let hasPendingMessages = false;

      if (leadResponse.ok) {
        leadInfo = await leadResponse.json();
        console.log('✅ Lead info obtenida del bot real:', leadInfo);
      } else {
        console.log('❌ Error obteniendo lead info:', leadResponse.status);
      }

      if (pendingMessagesResponse.ok) {
        const pendingData = await pendingMessagesResponse.json();
        hasPendingMessages = pendingData.hasPendingMessages || false;
        console.log('⏳ Mensajes pendientes:', hasPendingMessages);
      } else {
        console.log('❌ Error obteniendo mensajes pendientes:', pendingMessagesResponse.status);
      }

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        history = (messagesData.items || [])
          .sort((a: any, b: any) => parseInt(a.Timestamp) - parseInt(b.Timestamp))
          .map((msg: any) => ({
            role: msg.Direction === 'out' ? 'assistant' : 'user',
            content: msg.Text
          }));
        console.log('✅ Historial obtenido del bot real:', { 
          phoneNumber, 
          messagesCount: history.length,
          messages: history 
        });
      } else {
        console.log('❌ Error obteniendo mensajes:', messagesResponse.status);
      }

      return NextResponse.json({
        success: true,
        history,
        leadInfo,
        hasPendingMessages
      });

    } catch (error) {
      console.log('❌ Bot real no disponible:', (error as Error).message);
      // Devolver lista vacía en lugar de datos de ejemplo
      return NextResponse.json({
        success: true,
        history: [],
        leadInfo: {
          LeadId: phoneNumber,
          Status: 'NUEVO',
          Stage: 'PRECALIFICACION',
          Intent: null,
          Rooms: null,
          Budget: null,
          Neighborhood: null,
          PropertyId: null,
          QualificationData: {
            property_confirmed: false,
            buyer_confirmed: false,
            motive_confirmed: false,
            timeline_confirmed: false,
            financing_confirmed: false,
            ready_to_close: false,
            decision_maker: false
          }
        },
        hasPendingMessages: false
      });
    }

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
