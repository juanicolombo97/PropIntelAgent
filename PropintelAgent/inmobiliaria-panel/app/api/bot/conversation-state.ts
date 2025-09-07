// Estado global para mantener las conversaciones activas
// En producción, esto estaría en una base de datos como Redis o DynamoDB

interface ConversationState {
  phoneNumber: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  leadInfo: {
    LeadId: string;
    Status: string;
    Stage: string;
    Intent: string | null;
    Rooms: number | null;
    Budget: number | null;
    Neighborhood: string | null;
    PropertyId: string | null;
    QualificationData?: {
      property_confirmed: boolean;
      buyer_confirmed: boolean;
      motive_confirmed: boolean;
      timeline_confirmed: boolean;
      financing_confirmed: boolean;
      ready_to_close: boolean;
      needs_to_sell?: boolean;
      has_preapproval?: boolean;
      decision_maker: boolean;
    };
    Missing: string[];
  };
  lastActivity: Date;
}

// Almacén en memoria para las conversaciones
const conversations = new Map<string, ConversationState>();

// Limpiar conversaciones inactivas (más de 1 hora)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const entries = Array.from(conversations.entries());
  for (const [phoneNumber, conversation] of entries) {
    if (conversation.lastActivity < oneHourAgo) {
      conversations.delete(phoneNumber);
    }
  }
}, 15 * 60 * 1000); // Ejecutar cada 15 minutos

export function getConversation(phoneNumber: string): ConversationState {
  let conversation = conversations.get(phoneNumber);
  
  if (!conversation) {
    conversation = {
      phoneNumber,
      messages: [],
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
      },
      lastActivity: new Date()
    };
    conversations.set(phoneNumber, conversation);
  }
  
  return conversation;
}

export function updateConversation(phoneNumber: string, updates: Partial<ConversationState>) {
  const conversation = getConversation(phoneNumber);
  Object.assign(conversation, updates);
  conversation.lastActivity = new Date();
  conversations.set(phoneNumber, conversation);
}

export function addMessage(phoneNumber: string, role: 'user' | 'assistant', content: string) {
  const conversation = getConversation(phoneNumber);
  conversation.messages.push({
    role,
    content,
    timestamp: new Date()
  });
  conversation.lastActivity = new Date();
  conversations.set(phoneNumber, conversation);
}

export function updateLeadInfo(phoneNumber: string, leadInfo: Partial<ConversationState['leadInfo']>) {
  const conversation = getConversation(phoneNumber);
  Object.assign(conversation.leadInfo, leadInfo);
  conversation.lastActivity = new Date();
  conversations.set(phoneNumber, conversation);
}

export function clearConversation(phoneNumber: string) {
  conversations.delete(phoneNumber);
}
