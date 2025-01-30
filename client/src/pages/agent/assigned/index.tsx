import { FC, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/stores/userStore';
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
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-gray-500',
};

const AssignedTicketsPage: FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useUserStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchAssignedTickets = async () => {
      if (!currentUser) return;

      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('assigned_to', currentUser.id)
          .not('status', 'eq', 'closed')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTickets(data || []);
      } catch (error) {
        console.error('Error fetching assigned tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignedTickets();
  }, [currentUser]);

  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      // Update local state
      setTickets(tickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, status: newStatus }
          : ticket
      ));
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase.rpc('close_ticket', {
        ticket_id_param: ticketId,
        closer_id: currentUser.id,
      });

      if (error) throw error;

      // Remove the closed ticket from the list
      setTickets(tickets.filter(t => t.id !== ticketId));
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  };

  if (isLoading) {
    return <div>Loading assigned tickets...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Assigned Tickets</h1>
        <div className="text-sm text-muted-foreground">
          {tickets.length} active tickets
        </div>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="cursor-pointer hover:bg-accent/5" onClick={() => setLocation(`/agent/tickets/${ticket.id}`)}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{ticket.title}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Opened {ticket.created_at && formatDistanceToNow(new Date(ticket.created_at))} ago
                  </div>
                </div>
                <div className="flex gap-2">
                  {ticket.priority && (
                    <Badge className={priorityColors[ticket.priority]}>
                      {ticket.priority}
                    </Badge>
                  )}
                  {ticket.status && (
                    <Badge className={statusColors[ticket.status]}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {ticket.description}
              </p>
              <div className="flex justify-end gap-2">
                {ticket.status !== 'resolved' && (
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateStatus(ticket.id, 'resolved');
                    }}
                  >
                    Mark as Resolved
                  </Button>
                )}
                {ticket.status === 'resolved' && (
                  <Button
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTicket(ticket.id);
                    }}
                  >
                    Close Ticket
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {tickets.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No assigned tickets
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AssignedTicketsPage; 