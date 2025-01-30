import { useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useTicketStore } from '@/stores/ticketStore';
import { TicketForm } from '@/components/tickets/TicketForm';
import { TicketList } from '@/features/tickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import type { DbTicket, TicketStatus, TicketPriority } from '@/types/database';
import type { Ticket } from '@/features/tickets/types';

interface CreateTicketData {
  title: string;
  description: string;
  priority: DbTicket['priority'];
}

export default function CustomerPortal() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { tickets, fetchTickets, createTicket } = useTicketStore();

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
    }
  }, [currentUser, fetchTickets]);

  const customerTickets = tickets.filter(
    (ticket): ticket is Ticket => 
      ticket.customer_id === currentUser?.id && 
      ticket.status !== null &&
      ticket.priority !== null
  );

  const handleCreateTicket = async (data: CreateTicketData) => {
    if (!currentUser) return;
    
    try {
      await createTicket({
        ...data,
        customer_id: currentUser.id,
        status: 'open' as const,
        organization_id: currentUser.organization_id!,
        metadata: {},
        assigned_to: null,
        closed_at: null,
        last_activity_at: null,
      });
      navigate('/customer-portal');
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              Please log in to access the customer portal
            </h2>
            <p className="text-gray-600">
              You need to be logged in to create and view your tickets.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Customer Support</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Create a new support ticket or check the status of your existing tickets.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="new-ticket">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-ticket">New Ticket</TabsTrigger>
          <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
        </TabsList>
        <TabsContent value="new-ticket">
          <Card>
            <CardHeader>
              <CardTitle>Create New Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketForm onSubmit={handleCreateTicket} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="my-tickets">
          <Card>
            <CardHeader>
              <CardTitle>My Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketList
                tickets={customerTickets}
                onTicketSelect={(id) => navigate(`/tickets/${id}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
