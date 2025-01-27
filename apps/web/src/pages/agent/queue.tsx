import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import type { Ticket } from '@/types/database';

const priorityColors = {
  low: 'bg-blue-500/10 text-blue-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  high: 'bg-orange-500/10 text-orange-500',
  urgent: 'bg-red-500/10 text-red-500',
} as const;

const statusColors = {
  open: 'bg-green-500/10 text-green-500',
  in_progress: 'bg-yellow-500/10 text-yellow-500',
  resolved: 'bg-blue-500/10 text-blue-500',
  closed: 'bg-gray-500/10 text-gray-500',
} as const;

const categoryColors = {
  account: 'bg-purple-500/10 text-purple-500',
  billing: 'bg-emerald-500/10 text-emerald-500',
  technical_issue: 'bg-cyan-500/10 text-cyan-500',
  other: 'bg-gray-500/10 text-gray-500',
} as const;

export default function TicketQueue() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser: user } = useUserStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTickets() {
      if (!user?.organization_id) return;

      try {
        const { data: tickets, error } = await supabase
          .from('tickets')
          .select(`
            *,
            customer:customer_id(
              id,
              email,
              full_name
            ),
            assigned_to:assigned_agent_id(
              id,
              email,
              full_name
            )
          `)
          .eq('organization_id', user.organization_id)
          .in('status', ['open', 'in_progress']) // Only show open and in_progress tickets
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Sort tickets by urgency and creation date
        const sortedTickets = tickets?.sort((a, b) => {
          // Define urgency priority
          const urgencyPriority = {
            urgent: 4,
            high: 3,
            medium: 2,
            low: 1
          };

          // Compare urgency first
          const urgencyDiff = (urgencyPriority[b.priority] || 0) - (urgencyPriority[a.priority] || 0);
          if (urgencyDiff !== 0) return urgencyDiff;

          // If same urgency, sort by creation date (oldest first)
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        setTickets(sortedTickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();

    // Set up realtime subscription
    const channel = supabase
      .channel('queue_tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `organization_id=eq.${user?.organization_id}`,
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.organization_id]);

  const handleTicketClick = (ticketId: string) => {
    setLocation(`/agent/tickets/${ticketId}`);
  };

  const handleAssignToMe = async (e: React.MouseEvent, ticket: Ticket) => {
    e.stopPropagation(); // Prevent ticket card click
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_agent_id: user.id })
        .eq('id', ticket.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket assigned successfully.",
      });
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign ticket. Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Ticket Queue</h1>
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-gray-500">No tickets in queue</p>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleTicketClick(ticket.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{ticket.title}</h3>
                <div className="flex gap-2">
                  <Badge variant="secondary" className={priorityColors[ticket.priority]}>
                    {ticket.priority}
                  </Badge>
                  <Badge variant="secondary" className={statusColors[ticket.status]}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                  Customer: {ticket.customer?.email}
                </span>
                <div className="flex items-center gap-4">
                  <span>
                    Created: {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                  {!ticket.assigned_agent_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleAssignToMe(e, ticket)}
                    >
                      Assign to me
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
