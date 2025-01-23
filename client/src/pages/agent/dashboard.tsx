 import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
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

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  customer_id: string;
  customer: {
    email: string;
  };
  organization_id: string;
}

export default function AgentDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUserStore();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          customer:profiles!customer_id (
            email
          )
        `)
        .eq('organization_id', currentUser?.organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: Ticket['status']) => {
    const colors = {
      open: 'bg-yellow-500',
      in_progress: 'bg-blue-500',
      resolved: 'bg-green-500',
      closed: 'bg-gray-500'
    };
    return colors[status];
  };

  const getPriorityBadgeColor = (priority: Ticket['priority']) => {
    const colors = {
      low: 'bg-gray-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-500'
    };
    return colors[priority];
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agent Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser?.email}</p>
        </div>
        <Button>Create Ticket</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Open Tickets</CardTitle>
            <CardDescription>Active tickets requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {tickets.filter(t => t.status === 'open').length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>In Progress</CardTitle>
            <CardDescription>Tickets currently being worked on</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {tickets.filter(t => t.status === 'in_progress').length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resolved Today</CardTitle>
            <CardDescription>Tickets resolved in the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {tickets.filter(t => t.status === 'resolved').length}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>Manage and respond to customer tickets</CardDescription>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading tickets...</TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No tickets found</TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.title}</TableCell>
                    <TableCell>{ticket.customer.email}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadgeColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}