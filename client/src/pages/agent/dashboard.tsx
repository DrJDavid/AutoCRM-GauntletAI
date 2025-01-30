import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import { useTicketStore } from '@/stores/ticketStore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table';
import { supabase } from '@/lib/supabaseClient';
import type { DbTicket, TicketStatus, TicketPriority } from '@/types/database';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
};

interface TicketWithRelations extends Omit<DbTicket, 'assigned_to'> {
  customer?: Profile;
  assigned_to?: Profile | null;
}

const priorityColors: Record<TicketPriority, string> = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

const statusColors: Record<TicketStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  resolved: 'bg-gray-100 text-gray-800',
  closed: 'bg-gray-100 text-gray-800'
};

export default function AgentDashboard() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useUserStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect if no user or not an agent
    if (!currentUser) {
      navigate('/login');
      return;
    }

    async function fetchTickets() {
      if (!currentUser?.organization_id) {
        setError('No organization found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('tickets')
          .select(`
            id,
            title,
            description,
            status,
            priority,
            created_at,
            updated_at,
            closed_at,
            customer_id,
            organization_id,
            metadata,
            last_activity_at,
            customer:profiles!tickets_customer_id_fkey(
              id,
              email
            ),
            assigned_to:profiles!tickets_assigned_to_fkey(
              id,
              email
            )
          `)
          .eq('organization_id', currentUser.organization_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform the data to match our types
        const transformedData: TicketWithRelations[] = (data || []).map(ticket => ({
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
          closed_at: ticket.closed_at,
          customer_id: ticket.customer_id,
          organization_id: ticket.organization_id,
          metadata: ticket.metadata,
          last_activity_at: ticket.last_activity_at,
          customer: ticket.customer ? {
            id: ticket.customer.id,
            email: ticket.customer.email,
            full_name: null
          } : undefined,
          assigned_to: ticket.assigned_to ? {
            id: ticket.assigned_to.id,
            email: ticket.assigned_to.email,
            full_name: null
          } : null
        }));

        setTickets(transformedData);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError('Failed to fetch tickets');
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();

    // Subscribe to changes
    const channel = supabase
      .channel('tickets-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `organization_id=eq.${currentUser?.organization_id}`,
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, navigate]);

  const handleAssignToMe = async (e: React.MouseEvent, ticketId: string) => {
    e.stopPropagation();
    if (!currentUser?.id) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_to: currentUser.id })
        .eq('id', ticketId);

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

  const handleRowClick = (ticketId: string) => {
    navigate(`/agent/tickets/${ticketId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agent Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser?.email}</p>
        </div>
        <Button>Create Ticket</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {tickets.filter(t => t.status === 'open').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {tickets.filter(t => t.status === 'in_progress').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {tickets.filter(t => t.status === 'resolved').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(ticket.id)}
                >
                  <TableCell className="font-medium">{ticket.title}</TableCell>
                  <TableCell>{ticket.customer?.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status || 'open']}`}>
                      {(ticket.status || 'open').replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority || 'low']}`}>
                      {ticket.priority || 'low'}
                    </span>
                  </TableCell>
                  <TableCell>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    {ticket.assigned_to?.email || (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleAssignToMe(e, ticket.id)}
                      >
                        Assign to me
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}