import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useUserStore } from '@/stores/userStore';
import { useTicketStore } from '@/stores/ticketStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import type { DbTicket } from '@/types/database';

export default function AdminTicketDetailsPage() {
  const [, params] = useRoute('/admin/tickets/:id');
  const [, setLocation] = useLocation();
  const { currentUser } = useUserStore();
  const { tickets, fetchTickets } = useTicketStore();
  const [ticket, setTicket] = useState<DbTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetchTicketDetails(params.id);
    }
  }, [params?.id]);

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          customer:profiles!tickets_customer_id_fkey(*),
          assigned_agent:profiles!tickets_assigned_agent_id_fkey(*)
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticket details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: DbTicket['status']) => {
    if (!ticket) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Ticket status updated successfully',
      });

      fetchTicketDetails(ticket.id);
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket status',
        variant: 'destructive',
      });
    }
  };

  const handleAssignToMe = async () => {
    if (!ticket || !currentUser) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_agent_id: currentUser.id })
        .eq('id', ticket.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Ticket assigned successfully',
      });

      fetchTicketDetails(ticket.id);
      fetchTickets();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign ticket',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h3 className="font-semibold">Ticket Not Found</h3>
          <p className="text-sm text-muted-foreground">
            The ticket you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setLocation('/admin/tickets')}
          >
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/admin/tickets')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold">{ticket.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Ticket #{ticket.id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    ticket.priority === 'urgent'
                      ? 'destructive'
                      : ticket.priority === 'high'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {ticket.priority}
                </Badge>
                <Badge
                  variant={
                    ticket.status === 'open'
                      ? 'default'
                      : ticket.status === 'in_progress'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {ticket.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Customer</h4>
                <p>{ticket.customer?.email || 'Unknown'}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Assigned Agent</h4>
                {ticket.assigned_agent ? (
                  <p>{ticket.assigned_agent.email}</p>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAssignToMe}
                  >
                    Assign to me
                  </Button>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="whitespace-pre-wrap">{ticket.current_description}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Actions</h4>
              <div className="flex gap-2">
                {ticket.status === 'open' && (
                  <Button
                    variant="default"
                    onClick={() => handleStatusChange('in_progress')}
                  >
                    Start Working
                  </Button>
                )}
                {ticket.status === 'in_progress' && (
                  <Button
                    variant="default"
                    onClick={() => handleStatusChange('resolved')}
                  >
                    Mark as Resolved
                  </Button>
                )}
                {ticket.status === 'resolved' && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('closed')}
                  >
                    Close Ticket
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
