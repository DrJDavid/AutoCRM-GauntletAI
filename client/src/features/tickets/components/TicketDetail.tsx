import { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { Ticket, TicketMessage, TicketStatus } from '@/types';

interface TicketDetailProps {
  ticket: Ticket;
  messages: TicketMessage[];
  onStatusChange: (status: TicketStatus) => void;
}

export const TicketDetail: FC<TicketDetailProps> = ({
  ticket,
  messages,
  onStatusChange,
}) => {
  const renderMessage = (message: TicketMessage) => (
    <div key={message.id} className="flex gap-4 mb-4">
      <Avatar>
        {message.author_id.charAt(0).toUpperCase()}
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{message.author_id}</span>
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {message.is_internal && (
            <Badge variant="secondary">Internal Note</Badge>
          )}
        </div>
        <p className="text-gray-700">{message.content}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{ticket.title}</h2>
            <div className="flex gap-2 items-center">
              <Badge>{ticket.status}</Badge>
              <Badge variant="outline">{ticket.priority}</Badge>
              <Badge variant="secondary">{ticket.category}</Badge>
            </div>
          </div>
          <div className="space-x-2">
            {ticket.status !== 'closed' && (
              <Button
                variant="outline"
                onClick={() => onStatusChange('closed')}
              >
                Close Ticket
              </Button>
            )}
            {ticket.status === 'closed' && (
              <Button
                variant="outline"
                onClick={() => onStatusChange('open')}
              >
                Reopen Ticket
              </Button>
            )}
          </div>
        </div>
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Messages</h3>
        <div className="space-y-4">
          {messages.map(renderMessage)}
        </div>
      </Card>
    </div>
  );
}; 