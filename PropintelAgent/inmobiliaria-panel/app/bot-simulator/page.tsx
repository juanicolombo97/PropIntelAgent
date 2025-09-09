'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, Trash2, RefreshCw, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface LeadInfo {
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
  Missing?: string[];
}

export default function BotSimulatorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [leadInfo, setLeadInfo] = useState<LeadInfo | null>(null);
  const [existingLeads, setExistingLeads] = useState<any[]>([]);
  const [showLeadSelector, setShowLeadSelector] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string | null>(null);
  // const [waitingForBotResponse, setWaitingForBotResponse] = useState(false); // Removed - no longer needed
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showLoading = (message: string) => {
    setLoadingMessage(message);
    setShowLoadingModal(true);
  };

  const hideLoading = () => {
    setShowLoadingModal(false);
    setLoadingMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Hacer scroll al final cuando cambian los mensajes
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  useEffect(() => {
    // Hacer scroll cuando termina de cargar
    if (!isLoading && messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, messages.length]);

  useEffect(() => {
    // Cargar leads existentes al montar el componente (sin modal)
    loadExistingLeads(false);
  }, []);

  // Polling para verificar mensajes nuevos del bot
  useEffect(() => {
    console.log('🔄 useEffect de polling ejecutado para:', phoneNumber);
    if (!phoneNumber) return;

    let intervalId: NodeJS.Timeout;

    const pollForNewMessages = async () => {
      try {
        setIsPolling(true);
        console.log('🔄 Polling para mensajes nuevos...', phoneNumber, 'Timestamp:', new Date().toLocaleTimeString());
        const response = await fetch(`/api/bot/conversation-history?phone_number=${phoneNumber}`);
        if (response.ok) {
          const data = await response.json();
          const currentHistoryLength = data.history?.length || 0;
          
          // Obtener el último timestamp de los mensajes existentes si no lo tenemos
          let currentLastTimestamp = lastMessageTimestamp;
          if (!currentLastTimestamp && data.history && data.history.length > 0) {
            // Si no tenemos timestamp previo, usar el último mensaje del historial
            const lastMessage = data.history[data.history.length - 1];
            currentLastTimestamp = lastMessage.Timestamp;
            setLastMessageTimestamp(currentLastTimestamp);
          }

          console.log('📨 Datos del polling:', { 
            historyLength: currentHistoryLength, 
            lastMessageCount,
            lastTimestamp: currentLastTimestamp,
            hasNewMessages: currentHistoryLength > lastMessageCount,
            isBotTyping: isBotTyping
          });
          
          // Actualizar información del lead si hay cambios
          if (data.leadInfo) {
            setLeadInfo(prevLeadInfo => {
              // Comparar campos específicos para detectar cambios
              const hasChanges = !prevLeadInfo || 
                prevLeadInfo.Status !== data.leadInfo.Status ||
                prevLeadInfo.Stage !== data.leadInfo.Stage ||
                prevLeadInfo.Intent !== data.leadInfo.Intent ||
                prevLeadInfo.Neighborhood !== data.leadInfo.Neighborhood ||
                prevLeadInfo.Rooms !== data.leadInfo.Rooms ||
                prevLeadInfo.Budget !== data.leadInfo.Budget ||
                prevLeadInfo.PropertyId !== data.leadInfo.PropertyId ||
                JSON.stringify(prevLeadInfo.QualificationData) !== JSON.stringify(data.leadInfo.QualificationData);
              
              if (hasChanges) {
                console.log('📊 Lead info actualizada:', {
                  anterior: prevLeadInfo,
                  nueva: data.leadInfo,
                  cambios: {
                    Status: prevLeadInfo?.Status !== data.leadInfo.Status,
                    Stage: prevLeadInfo?.Stage !== data.leadInfo.Stage,
                    Intent: prevLeadInfo?.Intent !== data.leadInfo.Intent,
                    Neighborhood: prevLeadInfo?.Neighborhood !== data.leadInfo.Neighborhood,
                    Rooms: prevLeadInfo?.Rooms !== data.leadInfo.Rooms,
                    Budget: prevLeadInfo?.Budget !== data.leadInfo.Budget,
                    PropertyId: prevLeadInfo?.PropertyId !== data.leadInfo.PropertyId,
                    QualificationData: JSON.stringify(prevLeadInfo?.QualificationData) !== JSON.stringify(data.leadInfo.QualificationData)
                  }
                });
                return data.leadInfo;
              }
              return prevLeadInfo;
            });
          }
          
          // Filtrar mensajes nuevos del bot usando timestamp
          const newBotMessages = data.history
            .filter((msg: any) => {
              // Solo mensajes del bot
              if (msg.role !== 'assistant') return false;
              
              // Si no tenemos timestamp previo, no agregar mensajes (evitar duplicados en carga inicial)
              if (!currentLastTimestamp) return false;
              
              // Solo mensajes más nuevos que el último timestamp conocido
              return msg.Timestamp && msg.Timestamp > currentLastTimestamp;
            });
          
          if (newBotMessages.length > 0) {
            console.log('🤖 Mensajes nuevos del bot encontrados por timestamp:', newBotMessages.length);
            console.log('🕒 Timestamps:', newBotMessages.map((msg: any) => ({ content: msg.content.substring(0, 50), timestamp: msg.Timestamp })));
            
            setMessages(prev => {
              // Crear un mapa de contenido + timestamp existentes para evitar duplicados
              const existingMessageKeys = new Set(
                prev
                  .filter(msg => msg.sender === 'bot')
                  .map(msg => `${msg.content}_${msg.timestamp.getTime()}`)
              );
              
              // Convertir mensajes nuevos a formato local
              const newMessages = newBotMessages
                .map((msg: any) => ({
                  id: `bot_${msg.Timestamp}_${Date.now()}`,
                  content: msg.content,
                  sender: 'bot' as const,
                  timestamp: new Date(msg.Timestamp)
                }))
                .filter((newMsg: { id: string; content: string; sender: 'bot'; timestamp: Date }) => {
                  const messageKey = `${newMsg.content}_${newMsg.timestamp.getTime()}`;
                  return !existingMessageKeys.has(messageKey);
                });
              
              if (newMessages.length > 0) {
                console.log('➕ Agregando mensajes nuevos del bot:', newMessages);
                
                // Actualizar el último timestamp conocido
                const latestTimestamp = Math.max(...newBotMessages.map((msg: any) => msg.Timestamp));
                setLastMessageTimestamp(latestTimestamp.toString());
                
                // Agregar al final (los mensajes del bot siempre llegan después)
                return [...prev, ...newMessages];
              }
              
              return prev;
            });
            
            // Actualizar el contador de mensajes
            setLastMessageCount(currentHistoryLength);
            
            // Quitar "Gonzalo está escribiendo" cuando llegan mensajes nuevos
            console.log('✅ Hay mensajes nuevos del bot, quitando "Gonzalo está escribiendo"');
            setIsBotTyping(false);
          }
        }
      } catch (error) {
        console.log('❌ Error en polling:', error);
      } finally {
        setIsPolling(false);
      }
    };

    // Polling cada 30 segundos para detectar respuestas del bot real
    intervalId = setInterval(pollForNewMessages, 30000);
    
    console.log('🔄 Polling iniciado cada 30 segundos para:', phoneNumber, 'Interval ID:', intervalId);
    
    // Ejecutar inmediatamente al montar
    pollForNewMessages();
    
    return () => {
      if (intervalId) {
        console.log('🛑 Polling detenido para:', phoneNumber);
        clearInterval(intervalId);
      }
    };
  }, [phoneNumber, lastMessageTimestamp]); // Depende del phoneNumber y lastMessageTimestamp

  // Efecto para limpiar conversación cuando cambia el número de teléfono
  useEffect(() => {
    // Solo limpiar si ya hay un número de teléfono (no en la carga inicial)
    if (phoneNumber) {
      // Limpiar conversación cuando cambia el número de teléfono
      setMessages([]);
      setLeadInfo(null);
      setCurrentMessage('');
      setLastMessageCount(0);
      setLastMessageTimestamp(null);
      // setWaitingForBotResponse(false); // Removed
      setIsBotTyping(false);
      
      // Mostrar notificación
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    }
  }, [phoneNumber]);

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    // Validar que se haya ingresado un número de teléfono
    if (!phoneNumber.trim()) {
      alert('Por favor, ingresa un número de teléfono antes de enviar un mensaje');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    
    // Mostrar "Gonzalo está escribiendo" inmediatamente al enviar mensaje
    setIsBotTyping(true);

    try {
      
      // Llamar al endpoint del bot
      const response = await fetch('/api/bot/test-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          message: messageToSend
        })
      });

      if (!response.ok) {
        throw new Error('Error al comunicarse con el bot');
      }

      const data = await response.json();

      // Solo agregar mensaje del bot si hay contenido
      if (data.response && data.response.trim()) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        setIsBotTyping(false); // El bot ya respondió
      } else {
        // Si no hay respuesta, significa que se envió al bot real
        // No mostrar indicador de espera, solo mantener "Gonzalo está escribiendo"
        // setWaitingForBotResponse(true); // Comentado - no mostrar indicador
        // Quick poll: re-consultar en ~3s para reflejar estado sin refrescar
        setTimeout(() => {
          // Llamada silenciosa a historial para empujar cualquier cambio de leadInfo o mensajes del bot si existieran
          fetch(`/api/bot/conversation-history?phone_number=${phoneNumber}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
              if (!data) return;
              
              // Usar el mismo sistema de timestamps que el polling principal
              const newBotMessages = data.history
                .filter((msg: any) => {
                  // Solo mensajes del bot
                  if (msg.role !== 'assistant') return false;
                  
                  // Si no tenemos timestamp previo, no agregar mensajes
                  if (!lastMessageTimestamp) return false;
                  
                  // Solo mensajes más nuevos que el último timestamp conocido
                  return msg.Timestamp && msg.Timestamp > lastMessageTimestamp;
                });
                
              if (newBotMessages.length > 0) {
                console.log('⚡ Quick poll: Mensajes nuevos del bot encontrados por timestamp:', newBotMessages.length);
                
                setMessages(prev => {
                  // Crear un mapa de contenido + timestamp existentes para evitar duplicados
                  const existingMessageKeys = new Set(
                    prev
                      .filter(msg => msg.sender === 'bot')
                      .map(msg => `${msg.content}_${msg.timestamp.getTime()}`)
                  );
                  
                  // Convertir mensajes nuevos a formato local
                  const newMessages = newBotMessages
                    .map((msg: any) => ({
                      id: `qp_${msg.Timestamp}_${Date.now()}`,
                      content: msg.content,
                      sender: 'bot' as const,
                      timestamp: new Date(msg.Timestamp)
                    }))
                    .filter((newMsg: { id: string; content: string; sender: 'bot'; timestamp: Date }) => {
                      const messageKey = `${newMsg.content}_${newMsg.timestamp.getTime()}`;
                      return !existingMessageKeys.has(messageKey);
                    });
                  
                  if (newMessages.length > 0) {
                    console.log('⚡ Quick poll: Agregando mensajes nuevos del bot:', newMessages);
                    
                    // Actualizar el último timestamp conocido
                    const latestTimestamp = Math.max(...newBotMessages.map((msg: any) => msg.Timestamp));
                    setLastMessageTimestamp(latestTimestamp.toString());
                    
                    return [...prev, ...newMessages];
                  }
                  
                  return prev;
                });
                
                setLastMessageCount(data.history?.length || 0);
                setIsBotTyping(false);
              }
              
              if (data.leadInfo) {
                setLeadInfo(prev => JSON.stringify(prev) !== JSON.stringify(data.leadInfo) ? data.leadInfo : prev);
              }
            })
            .catch(() => {})
        }, 3000);
      }
        
      // Actualizar información del lead
      if (data.leadInfo) {
        console.log('📊 Lead info actualizada desde sendMessage:', data.leadInfo);
        setLeadInfo(data.leadInfo);
      }

      // No cargar leads existentes después de enviar mensaje para evitar modal
      // loadExistingLeads();

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Error: No se pudo procesar el mensaje. Verifica que el bot esté funcionando.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const clearConversation = async () => {
    try {
      // Limpiar en el servidor
      await fetch(`/api/bot/conversation-history?phone_number=${phoneNumber}`, {
        method: 'DELETE'
      });
      
      // Limpiar en el cliente
      setMessages([]);
      setLeadInfo(null);
      setLastMessageCount(0);
      setLastMessageTimestamp(null);
      // setWaitingForBotResponse(false); // Removed
      setIsBotTyping(false);
    } catch (error) {
      console.error('Error al limpiar conversación:', error);
      // Limpiar en el cliente aunque falle el servidor
      setMessages([]);
      setLeadInfo(null);
      setLastMessageCount(0);
      setLastMessageTimestamp(null);
      // setWaitingForBotResponse(false); // Removed
      setIsBotTyping(false);
    }
  };

  const loadExistingLeads = async (showModal: boolean = true) => {
    try {
      if (showModal) {
        showLoading('Cargando usuarios existentes...');
      }
      const response = await fetch('/api/bot/leads');
      
      if (response.ok) {
        const data = await response.json();
        setExistingLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Error cargando leads:', error);
    } finally {
      if (showModal) {
        hideLoading();
      }
    }
  };

  const selectExistingLead = async (leadId: string) => {
    setPhoneNumber(leadId);
    setShowLeadSelector(false);
    // El useEffect se encargará de limpiar la conversación
    // Luego cargamos el historial del usuario seleccionado
    setTimeout(() => {
      loadConversationHistory(leadId);
    }, 100);
  };

  const loadConversationHistory = async (specificPhoneNumber?: string) => {
    try {
      const phoneToUse = specificPhoneNumber || phoneNumber;
      
      if (!phoneToUse) {
        console.log('No hay número de teléfono para cargar historial');
        return;
      }
      
      showLoading('Cargando historial de conversación...');
      
      const response = await fetch(`/api/bot/conversation-history?phone_number=${phoneToUse}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar el historial');
      }

      const data = await response.json();
      
      // Convertir el historial a formato de mensajes
      const historyMessages: Message[] = data.history.map((msg: any, index: number) => ({
        id: `history_${index}_${Date.now()}`,
        content: msg.content,
        sender: msg.role === 'user' ? 'user' : 'bot',
        timestamp: new Date()
      }));

      setMessages(historyMessages);
      setLastMessageCount(historyMessages.length);
      
      // Establecer el último timestamp del historial cargado
      if (data.history && data.history.length > 0) {
        const lastMessage = data.history[data.history.length - 1];
        if (lastMessage.Timestamp) {
          setLastMessageTimestamp(lastMessage.Timestamp);
        }
      }
      
      console.log('📚 Historial cargado:', {
        phoneNumber: phoneToUse,
        messagesCount: historyMessages.length,
        lastMessageCount: historyMessages.length,
        lastTimestamp: data.history && data.history.length > 0 ? data.history[data.history.length - 1].Timestamp : null
      });
      
      if (data.leadInfo) {
        console.log('📊 Lead info actualizada desde loadConversationHistory:', data.leadInfo);
        setLeadInfo(data.leadInfo);
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      hideLoading();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
              <MessageCircle className="text-white" size={28} />
            </div>
            Simulador del Bot WhatsApp
          </h1>
          <p className="text-slate-600 mt-2">
            Prueba el bot inmobiliario en tiempo real y ve cómo responde a diferentes mensajes
          </p>
        </div>
      </div>

      {/* Notificación de conversación limpia */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-right duration-300">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} />
            <span>Conversación limpia - Nuevo número: {phoneNumber}</span>
          </div>
        </div>
      )}

      {/* Modal de Loading */}
      {showLoadingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm w-full mx-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg font-medium text-gray-900">{loadingMessage}</p>
              <p className="text-sm text-gray-500">Por favor espera...</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: 'calc(100vh - 300px)' }}>
        {/* Panel de conversación */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col overflow-hidden">
            {/* Header del chat */}
            <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-2 bg-green-500 rounded-full">
                      <Bot className="text-white" size={22} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">Gonzalo</h3>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      Agente Inmobiliario • En línea
                      {isPolling && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-xs">Verificando mensajes...</span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={loadConversationHistory}
                    variant="secondary"
                    size="sm"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    disabled={isPolling}
                  >
                    <RefreshCw size={16} className={isPolling ? 'animate-spin' : ''} />
                  </Button>
                  <Button
                    onClick={clearConversation}
                    variant="secondary"
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Área de mensajes */}
            <div className="overflow-y-auto p-6 bg-gradient-to-b from-slate-50 to-white chat-messages" style={{ height: 'calc(100vh - 450px)' }}>
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 mt-20">
                  <Bot size={48} className="mx-auto mb-4 text-slate-400" />
                  <p className="text-lg font-medium">¡Inicia una conversación!</p>
                  <p className="text-sm">Primero ingresa un número de teléfono y luego escribe un mensaje</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                            : 'bg-white border border-slate-200 text-slate-900 shadow-sm rounded-bl-md'
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <p className={`text-xs ${
                            message.sender === 'user' ? 'text-blue-200' : 'text-slate-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Indicador de que el bot está escribiendo */}
                  {isBotTyping && (
                    <div className="flex justify-start mb-3">
                      <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-sm rounded-bl-md">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-slate-500">Gonzalo está escribiendo...</span>
                        </div>
                      </div>
                    </div>
                  )}

                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input para enviar mensajes */}
            <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl flex-shrink-0 sticky bottom-0">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe un mensaje como cliente..."
                    disabled={isLoading}
                    className="w-full text-base py-3 px-4 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!currentMessage.trim() || !phoneNumber.trim()}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-4 py-3 rounded-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Panel de información del lead */}
        <div className="flex flex-col space-y-3" style={{ height: 'calc(100vh - 300px)' }}>
          {/* Configuración */}
          <Card className="p-3 flex-shrink-0">
            <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Phone size={16} className="text-blue-500" />
              Configuración
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Número de teléfono
                </label>
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Escribe un número o selecciona uno existente"
                  className="text-sm py-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Escribe un nuevo número o selecciona un usuario existente abajo
                </p>
              </div>
              
              <div>
                <button
                  onClick={() => setShowLeadSelector(!showLeadSelector)}
                  className="w-full text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                >
                  {showLeadSelector ? 'Ocultar' : 'Ver'} usuarios existentes ({existingLeads.length})
                </button>
                
                {showLeadSelector && (
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {existingLeads.map((lead) => (
                      <button
                        key={lead.LeadId}
                        onClick={() => selectExistingLead(lead.LeadId)}
                        className={`w-full text-left text-xs px-2 py-1 rounded transition-colors ${
                          lead.LeadId === phoneNumber
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{lead.LeadId}</span>
                          <span className={`px-1 py-0.5 rounded text-xs ${
                            lead.Status === 'CALIFICADO' 
                              ? 'bg-green-100 text-green-700'
                              : lead.Status === 'CALIFICANDO'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {lead.Status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Información del Lead */}
          <Card className="p-3 flex-1">
            <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <User size={16} className="text-green-500" />
              Información del Lead
            </h3>
            
            {leadInfo ? (
              <div className="space-y-3">
                {/* Estado y Etapa */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500 mb-1">Estado</p>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      leadInfo.Status === 'CALIFICADO' 
                        ? 'bg-green-100 text-green-800'
                        : leadInfo.Status === 'CALIFICANDO'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {leadInfo.Status}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-slate-500 mb-1">Etapa</p>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      leadInfo.Stage === 'FINALIZADO' 
                        ? 'bg-green-100 text-green-800'
                        : leadInfo.Stage === 'POST_CALIFICACION'
                        ? 'bg-blue-100 text-blue-800'
                        : leadInfo.Stage === 'CALIFICACION'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {leadInfo.Stage}
                    </span>
                  </div>
                </div>

                {/* Datos básicos */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500 mb-1">Intención</p>
                    <p className="font-medium">{leadInfo.Intent || 'No definida'}</p>
                  </div>
                  
                  <div>
                    <p className="text-slate-500 mb-1">Zona</p>
                    <p className="font-medium">{leadInfo.Neighborhood || 'No definida'}</p>
                  </div>
                  
                  <div>
                    <p className="text-slate-500 mb-1">Ambientes</p>
                    <p className="font-medium">{leadInfo.Rooms || 'No definido'}</p>
                  </div>
                  
                  <div>
                    <p className="text-slate-500 mb-1">Presupuesto</p>
                    <p className="font-medium">
                      {leadInfo.Budget 
                        ? `$${leadInfo.Budget.toLocaleString()}`
                        : 'No definido'
                      }
                    </p>
                  </div>
                </div>

                {/* Propiedad confirmada */}
                {leadInfo.PropertyId && (
                  <div>
                    <p className="text-slate-500 mb-1">Propiedad</p>
                    <p className="font-medium text-green-700">ID: {leadInfo.PropertyId}</p>
                  </div>
                )}

                {/* Datos de calificación */}
                {leadInfo.QualificationData && (
                  <div>
                    <p className="text-slate-500 mb-1">Progreso de calificación</p>
                    <div className="space-y-1">
                      {Object.entries(leadInfo.QualificationData).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 capitalize">
                            {key.replace('_', ' ')}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                            value 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {value ? '✓' : '○'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {leadInfo.Missing && leadInfo.Missing.length > 0 && (
                  <div>
                    <p className="text-slate-500 mb-1">Datos faltantes</p>
                    <div className="flex flex-wrap gap-1">
                      {leadInfo.Missing.map((item, index) => (
                        <span
                          key={index}
                          className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-4">
                <User size={20} className="mx-auto mb-1 text-slate-400" />
                <p className="text-xs">Envía un mensaje para ver la información del lead</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
