 import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus } from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  customer_id: string;
  assigned_agent_id: string | null;
  customer: {
    email: string;
  };
  organization_id: string;
}

const priorityColors = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  resolved: 'bg-gray-100 text-gray-800',
};

export default function AgentDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUserStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTickets() {
      if (!currentUser?.organization_id) return;

      try {
        const { data, error } = await supabase
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
          .eq('organization_id', currentUser.organization_id)
          .order('created_at', { ascending: false }); // Newest first

        if (error) throw error;
        setTickets(data || []);
      } catch (error) {
        console.error('Error fetching tickets:', error);
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
  }, [currentUser?.organization_id]);

  const handleAssignToMe = async (e: React.MouseEvent, ticketId: string) => {
    e.stopPropagation(); // Prevent row click
    if (!currentUser?.id) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_agent_id: currentUser.id })
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
    setLocation(`/agent/tickets/${ticketId}`);
  };

  if (loading) {
    return <div>Loading...</div>;
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
                    <Badge variant="secondary" className={statusColors[ticket.status]}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={priorityColors[ticket.priority]}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {ticket.assigned_to?.email || (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignToMe(e, ticket.id);
                        }}
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