import { useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useTicketStore } from '@/stores/ticketStore';
import { TicketForm } from '@/components/tickets/TicketForm';
import { TicketList } from '@/components/tickets/TicketList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export default function CustomerPortal() {
  const [, setLocation] = useLocation();
  const { currentUser } = useUserStore();
  const { tickets, fetchTickets, createTicket } = useTicketStore();

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
    }
  }, [currentUser, fetchTickets]);

  const customerTickets = tickets.filter(
    (ticket) => ticket.customerId === currentUser?.id
  );

  const handleCreateTicket = async (data: any) => {
    try {
      await createTicket({
        ...data,
        customerId: currentUser!.id,
        status: 'new',
      });
      setLocation('/customer-portal');
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
                onTicketSelect={(id) => setLocation(`/tickets/${id}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
