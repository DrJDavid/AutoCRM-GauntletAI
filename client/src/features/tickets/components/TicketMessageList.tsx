import { FC, useEffect } from 'react';
import { useTicketStore } from '@/stores/ticketStore';
import { useUserStore } from '@/stores/userStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Database } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';

type TicketMessage = Database['public']['Tables']['ticket_messages']['Row'];

interface TicketMessageListProps {
  ticketId: string;
}

export const TicketMessageList: FC<TicketMessageListProps> = ({ ticketId }) => {
  const { currentUser } = useUserStore();
  const { messages, fetchMessages, isLoading } = useTicketStore();

  useEffect(() => {
    if (ticketId) {
      fetchMessages(ticketId);
    }
  }, [ticketId, fetchMessages]);

  if (isLoading) {
    return <div>Loading messages...</div>;
  }

  const ticketMessages = messages.filter(m => m.ticket_id === ticketId);

  if (!ticketMessages.length) {
    return <div className="text-center text-muted-foreground">No messages yet</div>;
  }

  return (
    <div className="space-y-4">
      {ticketMessages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-4 ${
            message.sender_id === currentUser?.id ? 'flex-row-reverse' : ''
          }`}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback>
              {message.sender_id.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className={`flex-1 space-y-1 ${
            message.sender_id === currentUser?.id ? 'items-end' : ''
          }`}>
            <div className={`rounded-lg p-4 ${
              message.sender_id === currentUser?.id
                ? 'bg-primary text-primary-foreground ml-auto'
                : 'bg-muted'
            }`}>
              <p className="text-sm">{message.message}</p>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {message.created_at && formatDistanceToNow(new Date(message.created_at))} ago
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}; 