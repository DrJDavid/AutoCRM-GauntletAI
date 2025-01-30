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
type TicketPriority = Database['public']['Enums']['ticket_priority'];

const priorityOrder: Record<TicketPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const priorityColors: Record<TicketPriority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-gray-500',
};

const TicketQueuePage: FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useUserStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchUnassignedTickets = async () => {
      if (!currentUser?.organization_id) return;

      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('organization_id', currentUser.organization_id)
          .is('assigned_to', null)
          .eq('status', 'open')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setTickets(data || []);
      } catch (error) {
        console.error('Error fetching unassigned tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnassignedTickets();
  }, [currentUser?.organization_id]);

  const handleAssignTicket = async (ticketId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase.rpc('assign_ticket', {
        ticket_id_param: ticketId,
        agent_id_param: currentUser.id,
      });

      if (error) throw error;

      // Remove the assigned ticket from the queue
      setTickets(tickets.filter(t => t.id !== ticketId));

      // Navigate to the assigned ticket
      setLocation(`/agent/tickets/${ticketId}`);
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  };

  // Sort tickets by priority
  const sortedTickets = [...tickets].sort((a, b) => {
    const priorityA = a.priority ? priorityOrder[a.priority] : 4;
    const priorityB = b.priority ? priorityOrder[b.priority] : 4;
    return priorityA - priorityB;
  });

  if (isLoading) {
    return <div>Loading ticket queue...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ticket Queue</h1>
        <div className="text-sm text-muted-foreground">
          {tickets.length} unassigned tickets
        </div>
      </div>

      <div className="grid gap-4">
        {sortedTickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{ticket.title}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Opened {ticket.created_at && formatDistanceToNow(new Date(ticket.created_at))} ago
                  </div>
                </div>
                {ticket.priority && (
                  <Badge className={priorityColors[ticket.priority]}>
                    {ticket.priority}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {ticket.description}
              </p>
              <div className="flex justify-end">
                <Button
                  variant="default"
                  onClick={() => handleAssignTicket(ticket.id)}
                >
                  Assign to Me
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {tickets.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No tickets in queue
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TicketQueuePage; 