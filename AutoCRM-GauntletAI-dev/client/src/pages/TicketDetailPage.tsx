import { useEffect } from 'react';
import { useRoute } from 'wouter';
import { useTicketStore } from '@/stores/ticketStore';
import { TicketDetail } from '@/components/tickets/TicketDetail';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function TicketDetailPage() {
  const [match, params] = useRoute('/tickets/:id');
  const { tickets, selectedTicket, fetchTickets, setSelectedTicket } = useTicketStore();

  useEffect(() => {
    if (!tickets.length) {
      fetchTickets();
    }
  }, [fetchTickets, tickets.length]);

  useEffect(() => {
    if (params?.id && tickets.length) {
      const ticket = tickets.find((t) => t.id === params.id);
      if (ticket) {
        setSelectedTicket(ticket);
      }
    }
  }, [params?.id, tickets, setSelectedTicket]);

  if (!selectedTicket) {
    return <div>Loading...</div>;
  }

  // Mock messages for demo
  const messages = [
    {
      id: '1',
      ticketId: selectedTicket.id,
      userId: 'customer@example.com',
      content: 'Initial ticket description',
      isInternal: false,
      attachments: [],
      createdAt: selectedTicket.createdAt,
    },
    {
      id: '2',
      ticketId: selectedTicket.id,
      userId: 'agent@example.com',
      content: 'Internal note about the ticket',
      isInternal: true,
      attachments: [],
      createdAt: selectedTicket.updatedAt,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tickets">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Ticket Details</h1>
      </div>

      <TicketDetail
        ticket={selectedTicket}
        messages={messages}
      />
    </div>
  );
}
