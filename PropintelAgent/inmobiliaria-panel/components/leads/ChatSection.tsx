import { Message } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { formatTimestamp } from '@/lib/utils';
import { MessageSquare, User, Bot } from 'lucide-react';

interface ChatSectionProps {
  leadId: string;
  messages: Message[];
}

export function ChatSection({ leadId, messages }: ChatSectionProps) {
  const sortedMessages = messages.sort((a, b) => parseInt(a.Timestamp) - parseInt(b.Timestamp));

  return (
    <Card title="Chat con el Lead">
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {sortedMessages.length > 0 ? (
          sortedMessages.map((message, index) => (
            <div 
              key={`${message.Timestamp}-${index}`} 
              className={`flex gap-3 p-3 rounded-lg border ${
                message.Direction === 'in' 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex-shrink-0">
                {message.Direction === 'in' ? (
                  <div className="p-2 bg-blue-500 rounded-full">
                    <User size={16} className="text-white" />
                  </div>
                ) : (
                  <div className="p-2 bg-green-500 rounded-full">
                    <Bot size={16} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">
                    {message.Direction === 'in' ? 'Cliente' : 'Gonzalo (Bot)'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(message.Timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                  {message.Text}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No hay mensajes</p>
            <p className="text-sm">Aún no se han intercambiado mensajes con este lead</p>
          </div>
        )}
      </div>
      
      {sortedMessages.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Total de mensajes: {sortedMessages.length}</span>
            <span>
              {sortedMessages.filter(m => m.Direction === 'in').length} del cliente, 
              {sortedMessages.filter(m => m.Direction === 'out').length} del bot
            </span>
          </div>
        </div>
      )}
    </Card>
  );
} 