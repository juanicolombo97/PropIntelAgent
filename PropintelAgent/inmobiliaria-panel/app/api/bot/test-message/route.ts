import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '../../../../config/api';
import { getConversation, addMessage, updateLeadInfo } from '../conversation-state';

export async function POST(request: NextRequest) {
  try {
    const { phone_number, message } = await request.json();

    if (!phone_number || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Obtener conversación existente
    const conversation = getConversation(phone_number);
    
    // Llamar al bot real de WhatsApp
    const botResponse = await callWhatsAppBot(phone_number, message);

    // Guardar mensaje del usuario
    addMessage(phone_number, 'user', message);
    
    // Guardar respuesta del bot
    addMessage(phone_number, 'assistant', botResponse.reply);
    
    // Actualizar información del lead
    updateLeadInfo(phone_number, botResponse.leadInfo);

    return NextResponse.json({
      success: true,
      response: botResponse.reply,
      leadInfo: botResponse.leadInfo,
    });

  } catch (error) {
    console.error('Error en bot test-message:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función que se conecta realmente al bot de WhatsApp
async function callWhatsAppBot(phoneNumber: string, message: string) {
  try {
    // Intentar conectar al bot real de WhatsApp (usar Lambda en producción)
    const BOT_WEBHOOK_URL = API_CONFIG.LAMBDA_API_URL;
    
    try {
      // Llamada al endpoint real del webhook (como un usuario real de WhatsApp)
      const response = await fetch(`${BOT_WEBHOOK_URL}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: phoneNumber,
          Body: message
        })
      });

      if (response.ok) {
        const xmlText = await response.text();
        
        // El bot real responde con un ACK vacío inmediatamente
        // La respuesta real llegará después de 3 minutos via polling
        if (xmlText.includes('<Response></Response>') || xmlText.includes('<Message></Message>')) {
          // El bot recibió el mensaje correctamente, pero la respuesta llegará en 3 minutos
          console.log('✅ Bot real recibió el mensaje, respuesta llegará en ~3 minutos');
          
          // Obtener información del lead desde la base de datos
          const leadResponse = await fetch(`${BOT_WEBHOOK_URL}/admin/lead?lead_id=${phoneNumber}`, {
            method: 'GET',
            headers: {
              'x-api-key': API_CONFIG.ADMIN_API_KEY,
            }
          });
          
          let leadInfo = { LeadId: phoneNumber, Status: 'NUEVO' };
          if (leadResponse.ok) {
            leadInfo = await leadResponse.json();
            console.log('📊 Lead info obtenida después de enviar mensaje:', leadInfo);
          } else {
            console.log('❌ Error obteniendo lead info después de enviar mensaje:', leadResponse.status);
          }
          
          return {
            reply: '', // No mostrar mensaje, solo el indicador azul
            leadInfo
          };
        } else {
          // Extraer el mensaje de la respuesta XML si hay contenido
          const messageMatch = xmlText.match(/<Message>([\s\S]*?)<\/Message>/);
          const reply = messageMatch ? messageMatch[1].trim() : 'Disculpa, tuve un problema técnico. Podés intentar de nuevo en un momento?';
          
          // Obtener información del lead desde la base de datos
          const leadResponse = await fetch(`${BOT_WEBHOOK_URL}/admin/lead?lead_id=${phoneNumber}`, {
            method: 'GET',
            headers: {
              'x-api-key': API_CONFIG.ADMIN_API_KEY,
            }
          });
          
          let leadInfo = { LeadId: phoneNumber, Status: 'NUEVO' };
          if (leadResponse.ok) {
            leadInfo = await leadResponse.json();
          }
          
          return {
            reply,
            leadInfo
          };
        }
      }
    } catch (error) {
      console.log('Bot real no disponible, usando simulación:', error instanceof Error ? error.message : String(error));
    }
    
    // Fallback: simulación si el bot real no está disponible
    
    // Respuestas contextuales mejoradas del bot
    const contextualResponses = {
      'hola buenas': 'Para ayudarte mejor, me decis si estás buscando para alquilar o comprar?',
      'hola': 'Para ayudarte mejor, me decis si estás buscando para alquilar o comprar?',
      'te hablo por una propiedad en nuñez': 'Perfecto! Me escribiste por la propiedad de Núñez. Decime, esta propiedad sería para vos o para alguien más?',
      'quiero alquilar en palermo': 'Perfecto, estás buscando para alquilar en Palermo. Esta propiedad sería para vos o para alguien más?',
      'busco un departamento de 2 ambientes': 'Entiendo, buscás un departamento de 2 ambientes. ¿En qué zona te gustaría?',
      'mi presupuesto es 200k': 'Perfecto, con un presupuesto de $200,000. ¿Estás buscando para alquilar o comprar?',
      'quiero coordinar una visita': 'Me gustaría coordinarte la visita, pero antes necesito confirmar unos datos que pide el sistema. Por cuál propiedad específica te contactaste?',
      'es para mudarme': 'Perfecto, es para mudarte. En qué plazo te gustaría mudarte y hace cuánto empezaste a buscar?',
      'es para inversión': 'Entiendo, es para inversión. Tenés experiencia invirtiendo en inmuebles?',
      'alquilar': 'Perfecto, estás buscando para alquilar. ¿En qué zona te gustaría vivir?',
      'comprar': 'Perfecto, estás buscando para comprar. ¿En qué zona te interesa?',
      'es para mí': 'Entiendo, es para vos. ¿La idea es mudarte o es para inversión?'
    };

    const lowerMessage = message.toLowerCase();
    
    // Buscar respuesta exacta o contextual
    let reply = contextualResponses[lowerMessage as keyof typeof contextualResponses];
    
    if (!reply) {
      // Generar respuesta basada en palabras clave
      if (lowerMessage.includes('propiedad') && (lowerMessage.includes('nuñez') || lowerMessage.includes('palermo'))) {
        const zona = lowerMessage.includes('nuñez') ? 'Núñez' : 'Palermo';
        reply = `Perfecto! Me escribiste por la propiedad de ${zona}. Decime, esta propiedad sería para vos o para alguien más?`;
      } else if (lowerMessage.includes('alquilar') || lowerMessage.includes('alquiler')) {
        reply = 'Perfecto, estás buscando para alquilar. ¿En qué zona te gustaría vivir?';
      } else if (lowerMessage.includes('comprar') || lowerMessage.includes('venta')) {
        reply = 'Perfecto, estás buscando para comprar. ¿En qué zona te interesa?';
      } else if (lowerMessage.includes('ambientes') || lowerMessage.includes('dormitorios')) {
        reply = 'Entiendo tus preferencias de ambientes. ¿En qué zona te gustaría vivir?';
      } else if (lowerMessage.includes('presupuesto') || lowerMessage.includes('$') || /\d+k/.test(lowerMessage)) {
        reply = 'Perfecto, tengo en cuenta tu presupuesto. ¿Estás buscando para alquilar o comprar?';
      } else if (lowerMessage.includes('visita') || lowerMessage.includes('ver') || lowerMessage.includes('conocer')) {
        reply = 'Me gustaría coordinarte la visita, pero antes necesito confirmar unos datos que pide el sistema. Lo resolvemos rápido y seguimos.';
      } else {
        reply = 'Entiendo. Contame un poco más para poder ayudarte mejor. ¿Estás buscando para alquilar o comprar?';
      }
    }

    // Generar información del lead basada en el mensaje y el contexto existente
    const leadInfo = generateLeadInfo(phoneNumber, message, lowerMessage, null);

    // Simular delay realista del bot
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    return {
      reply,
      leadInfo
    };

  } catch (error) {
    console.error('Error calling WhatsApp bot:', error);
    return {
      reply: 'Disculpa, tuve un problema técnico. Podés intentar de nuevo en un momento?',
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
        },
        Missing: ['Intent', 'Rooms', 'Budget', 'Neighborhood']
      }
    };
  }
}

// Función para generar información inteligente del lead
function generateLeadInfo(phoneNumber: string, originalMessage: string, lowerMessage: string, existingLeadInfo: any) {
  // Mantener información existente y agregar nueva
  const leadInfo = {
    LeadId: phoneNumber,
    Status: existingLeadInfo?.Status || 'NUEVO',
    Stage: existingLeadInfo?.Stage || 'PRECALIFICACION',
    Intent: existingLeadInfo?.Intent || null,
    Rooms: existingLeadInfo?.Rooms || null,
    Budget: existingLeadInfo?.Budget || null,
    Neighborhood: existingLeadInfo?.Neighborhood || null,
    PropertyId: existingLeadInfo?.PropertyId || null,
    QualificationData: existingLeadInfo?.QualificationData || {
      property_confirmed: false,
      buyer_confirmed: false,
      motive_confirmed: false,
      timeline_confirmed: false,
      financing_confirmed: false,
      ready_to_close: false,
      decision_maker: false
    },
    Missing: [] as string[]
  };

  // Detectar intención (solo si no está ya definida)
  if (!leadInfo.Intent) {
    if (lowerMessage.includes('alquilar') || lowerMessage.includes('alquiler')) {
      leadInfo.Intent = 'alquiler';
    } else if (lowerMessage.includes('comprar') || lowerMessage.includes('venta')) {
      leadInfo.Intent = 'venta';
    }
  }

  // Detectar zona/barrio (solo si no está ya definida)
  if (!leadInfo.Neighborhood) {
    if (lowerMessage.includes('nuñez')) {
      leadInfo.Neighborhood = 'Núñez';
    } else if (lowerMessage.includes('palermo')) {
      leadInfo.Neighborhood = 'Palermo';
    } else if (lowerMessage.includes('belgrano')) {
      leadInfo.Neighborhood = 'Belgrano';
    } else if (lowerMessage.includes('recoleta')) {
      leadInfo.Neighborhood = 'Recoleta';
    } else if (lowerMessage.includes('villa crespo')) {
      leadInfo.Neighborhood = 'Villa Crespo';
    } else if (lowerMessage.includes('caballito')) {
      leadInfo.Neighborhood = 'Caballito';
    }
  }

  // Detectar cantidad de ambientes (solo si no está ya definida)
  if (!leadInfo.Rooms) {
    const roomsMatch = lowerMessage.match(/(\d+)\s*(ambientes?|dormitorios?|habitaciones?|cuartos?)/);
    if (roomsMatch) {
      leadInfo.Rooms = parseInt(roomsMatch[1]);
    } else if (lowerMessage.includes('monoambiente') || lowerMessage.includes('mono')) {
      leadInfo.Rooms = 1;
    }
  }

  // Detectar presupuesto (solo si no está ya definido)
  if (!leadInfo.Budget) {
    const budgetPatterns = [
      /(\d+)k/,  // 200k
      /(\d+\.?\d*)\s*m/,  // 1.5M
      /\$\s*(\d{1,3}(?:[.,]\d{3})*)/,  // $200,000
      /(\d{1,3}(?:[.,]\d{3})*)\s*pesos?/,  // 200000 pesos
      /presupuesto.*?(\d{1,3}(?:[.,]\d{3})*)/  // presupuesto 200000
    ];

    for (const pattern of budgetPatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        try {
          let amount = match[1].replace(/[.,]/g, '');
          if (pattern.source.includes('k')) {
            leadInfo.Budget = parseInt(amount) * 1000;
          } else if (pattern.source.includes('m')) {
            leadInfo.Budget = parseInt((parseFloat(amount) * 1000000).toString());
          } else {
            leadInfo.Budget = parseInt(amount);
          }
          break;
        } catch (e) {
          // Ignorar errores de parsing
        }
      }
    }
  }

  // Determinar datos faltantes
  const allFields = ['Intent', 'Rooms', 'Budget', 'Neighborhood'];
  leadInfo.Missing = allFields.filter(field => !leadInfo[field as keyof typeof leadInfo]);

  // Determinar estado y etapa basado en datos completados
  const completedFields = [leadInfo.Intent, leadInfo.Rooms, leadInfo.Budget, leadInfo.Neighborhood].filter(field => field !== null && field !== undefined).length;
  
  if (completedFields >= 3) {
    leadInfo.Status = 'CALIFICADO';
    leadInfo.Stage = 'POST_CALIFICACION';
  } else if (completedFields >= 2) {
    leadInfo.Status = 'CALIFICANDO';
    leadInfo.Stage = 'CALIFICACION';
  } else {
    leadInfo.Status = 'NUEVO';
    leadInfo.Stage = 'PRECALIFICACION';
  }

  return leadInfo;
}
