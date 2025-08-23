import { Message } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatTimestamp } from '@/lib/utils';
import { MessageSquare, Send } from 'lucide-react';

interface MessagesListProps {
  messages: Message[];
}

export function MessagesList({ messages }: MessagesListProps) {
  const getDirectionBadge = (direction: string) => {
    const variants = {
      in: 'success' as const,
      out: 'info' as const,
    };
    const icons = {
      in: <MessageSquare size={12} />,
      out: <Send size={12} />,
    };
    return (
      <Badge variant={variants[direction as keyof typeof variants] || 'default'} size="sm">
        <span className="flex items-center gap-1">
          {icons[direction as keyof typeof icons]}
          {direction === 'in' ? 'Recibido' : 'Enviado'}
        </span>
      </Badge>
    );
  };

  return (
    <Card title="Mensajes Recientes">
      <div className="space-y-3">
        {messages?.map((message) => (
          <div key={message.Timestamp} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              {getDirectionBadge(message.Direction)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">
                  {formatTimestamp(message.Timestamp)}
                </span>
              </div>
              <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                {message.Text}
              </p>
            </div>
          </div>
        ))}
        {(!messages || messages.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            No hay mensajes disponibles
          </div>
        )}
      </div>
    </Card>
  );
} 