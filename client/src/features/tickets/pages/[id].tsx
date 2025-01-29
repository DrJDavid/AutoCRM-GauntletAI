import { useEffect } from 'react';
import { useRoute } from 'wouter';
import { useTicketStore } from '@/stores/ticketStore';
import { TicketDetail } from '../components/TicketDetail';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';
import type { Ticket, TicketMessage, TicketStatus } from '@/types';

export default function TicketDetailPage() {
  const [match, params] = useRoute('/tickets/:id');
  const { tickets, selectedTicket, fetchTickets, setSelectedTicket, updateTicket } = useTicketStore();

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

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (selectedTicket) {
      await updateTicket(selectedTicket.id, {
        status: newStatus,
        description: selectedTicket.description,
        updated_at: new Date().toISOString()
      });
      
      // Refresh tickets to get the latest data
      fetchTickets();
    }
  };

  if (!selectedTicket) {
    return <div>Loading...</div>;
  }

  // Create properly typed mock messages
  const messages: TicketMessage[] = [
    {
      id: '1',
      ticket_id: selectedTicket.id,
      author_id: 'customer@example.com',
      content: selectedTicket.description || '',
      is_internal: false,
      metadata: null,
      created_at: selectedTicket.created_at
    },
    {
      id: '2',
      ticket_id: selectedTicket.id,
      author_id: 'agent@example.com',
      content: 'Internal note about the ticket',
      is_internal: true,
      metadata: null,
      created_at: selectedTicket.created_at
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
        onStatusChange={handleStatusChange}
      />
    </div>
  );
} 
