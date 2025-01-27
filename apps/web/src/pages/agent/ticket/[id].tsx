import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import { TicketChat } from '@/components/chat/TicketChat';
import { FileViewer } from '@/components/FileViewer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/components/ui/use-toast';

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
    full_name?: string;
  };
  organization_id: string;
  attachments?: {
    id: string;
    file_name: string;
    storage_path: string;
    content_type: string;
    file_size: number;
  }[];
}

export default function AgentTicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUserStore();

  useEffect(() => {
    if (id && currentUser?.organization_id) {
      fetchTicket();
    }
  }, [id, currentUser]);

  const fetchTicket = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          customer:profiles!customer_id (
            email,
            full_name
          ),
          attachments (
            id,
            file_name,
            storage_path,
            content_type,
            file_size
          )
        `)
        .eq('id', id)
        .eq('organization_id', currentUser?.organization_id)
        .single();

      if (error) throw error;
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast({
        title: "Error",
        description: "Failed to load ticket details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (newStatus: Ticket['status']) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating ticket status:', error);
        let errorMessage = 'Failed to update ticket status.';
        
        // Provide more specific error messages based on the error
        if (error.message?.includes('Customers can only')) {
          errorMessage = 'As a customer, you can only close tickets you have opened.';
        } else if (error.message?.includes('Agents can only')) {
          errorMessage = 'You can only modify tickets within your organization.';
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      setTicket(prev => prev ? { ...prev, status: newStatus } : null);
      toast({
        title: "Success",
        description: `Ticket status updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAvailableStatusOptions = () => {
    if (!ticket || !currentUser?.role) return [];

    const allStatuses: Ticket['status'][] = ['open', 'in_progress', 'resolved', 'closed'];
    
    if (currentUser.role === 'customer') {
      // Customers can only close their tickets
      return ticket.status === 'open' ? ['open', 'closed'] : [ticket.status];
    }
    
    // Agents and admins can use all statuses
    return allStatuses;
  };

  const StatusSelect = () => {
    const availableStatuses = getAvailableStatusOptions();
    const isDisabled = availableStatuses.length <= 1;

    return (
      <Select
        value={ticket?.status}
        onValueChange={updateTicketStatus}
        disabled={isDisabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {availableStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const updateTicketPriority = async (newPriority: Ticket['priority']) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ priority: newPriority })
        .eq('id', id);

      if (error) throw error;
      
      setTicket(prev => prev ? { ...prev, priority: newPriority } : null);
      toast({
        title: "Success",
        description: "Ticket priority updated successfully.",
      });
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket priority. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="container mx-auto py-6">Loading...</div>;
  }

  if (!ticket) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-6">
            <p>Ticket not found or you don't have permission to view it.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{ticket.title}</CardTitle>
              <CardDescription>
                Submitted by {ticket.customer.full_name || ticket.customer.email}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <StatusSelect />
              <Select
                value={ticket.priority}
                onValueChange={updateTicketPriority}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Badge className={getStatusBadgeColor(ticket.status)}>
              {ticket.status}
            </Badge>
            <Badge className={getPriorityBadgeColor(ticket.priority)}>
              {ticket.priority}
            </Badge>
            <Badge variant="outline">
              Created {new Date(ticket.created_at).toLocaleDateString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="attachments">
            Attachments ({ticket.attachments?.length || 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chat">
          <Card>
            <CardContent className="pt-6">
              <TicketChat ticketId={ticket.id} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="attachments">
          <Card>
            <CardContent className="pt-6">
              {ticket.attachments && ticket.attachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ticket.attachments.map((attachment) => (
                    <FileViewer
                      key={attachment.id}
                      file={attachment}
                    />
                  ))}
                </div>
              ) : (
                <p>No attachments found for this ticket.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
