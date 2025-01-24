import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabaseClient';
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

export default function AssignedTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUserStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    async function fetchAssignedTickets() {
      if (!currentUser?.id) return;

      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*, customer:customer_id(*)')
          .eq('assigned_agent_id', currentUser.id)
          .eq('organization_id', currentUser.organization_id)
          .not('status', 'eq', 'closed') // Exclude closed tickets
          .order('priority', { ascending: false }) // Higher priority first
          .order('created_at', { ascending: true }); // Older tickets first within same priority

        if (error) throw error;
        
        // Sort tickets by priority order and then by creation date
        const sortedTickets = (data || []).sort((a, b) => {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        
        setTickets(sortedTickets);
      } catch (error) {
        console.error('Error fetching assigned tickets:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignedTickets();

    // Set up realtime subscription
    const channel = supabase
      .channel('assigned_tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `assigned_agent_id=eq.${currentUser?.id}`,
        },
        () => {
          fetchAssignedTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, currentUser?.organization_id]);

  const handleTicketClick = (ticketId: string) => {
    setLocation(`/agent/tickets/${ticketId}`);
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
      <h1 className="text-3xl font-bold mb-8">My Assigned Tickets</h1>
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-gray-500">No tickets assigned to you</p>
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
                  <Badge variant="secondary" className={categoryColors[ticket.category]}>
                    {ticket.category.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-2">
                Customer: {ticket.customer.email}
              </div>
              <div className="text-sm text-gray-500">
                Created: {new Date(ticket.created_at).toLocaleString()}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
