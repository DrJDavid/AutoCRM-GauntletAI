import { FC, useEffect } from 'react';
import { useParams } from 'wouter';
import { useTicketStore } from '@/stores/ticketStore';
import { useUserStore } from '@/stores/userStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/types/supabase';
import { TicketMessageList } from '@/features/tickets/components/TicketMessageList';
import { TicketReplyForm } from '@/features/tickets/components/TicketReplyForm';
import { formatDistanceToNow } from 'date-fns';

type Ticket = Database['public']['Tables']['tickets']['Row'];
type TicketStatus = Database['public']['Enums']['ticket_status'];
type TicketPriority = Database['public']['Enums']['ticket_priority'];

const statusColors: Record<TicketStatus, string> = {
  open: 'bg-green-500',
  in_progress: 'bg-blue-500',
  pending: 'bg-yellow-500',
  resolved: 'bg-purple-500',
  closed: 'bg-gray-500'
};

const priorityColors: Record<TicketPriority, string> = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-yellow-500',
  urgent: 'bg-red-500'
};

const TicketDetails: FC = () => {
  const { id } = useParams();
  const { currentUser } = useUserStore();
  const { tickets, fetchTicket, isLoading } = useTicketStore();
  
  const ticket = tickets.find(t => t.id === id);

  useEffect(() => {
    if (id) {
      fetchTicket(id);
    }
  }, [id, fetchTicket]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!ticket || ticket.customer_id !== currentUser?.id) {
    return <div>Ticket not found or unauthorized</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{ticket.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Opened {ticket.created_at && formatDistanceToNow(new Date(ticket.created_at))} ago
              </p>
            </div>
            <div className="flex gap-2">
              {ticket.status && (
                <Badge className={statusColors[ticket.status]}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
              )}
              {ticket.priority && (
                <Badge className={priorityColors[ticket.priority]}>
                  {ticket.priority}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            {ticket.description}
          </p>
          
          <div className="space-y-6">
            <TicketMessageList ticketId={ticket.id} />
            <TicketReplyForm ticketId={ticket.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketDetails;
