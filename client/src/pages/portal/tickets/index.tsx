import { FC } from 'react';
import { useTicketStore } from '@/stores/ticketStore';
import { TicketList } from '@/features/tickets';
import { PageHeader } from '@/components/ui';
import { useUserStore } from '@/stores/userStore';
import { useNavigate } from 'react-router-dom';
import type { Ticket, TicketStatus, TicketPriority } from '@/features/tickets/types';
import type { DbTicket } from '@/types/database';

const CustomerTickets: FC = () => {
  const { currentUser } = useUserStore();
  const { tickets, isLoading } = useTicketStore();
  const navigate = useNavigate();

  // Filter tickets to only show the current customer's tickets with valid status and priority
  const customerTickets = tickets.filter((ticket): ticket is Ticket => {
    const hasValidStatus = ticket.status !== null && 
      ['open', 'in_progress', 'pending', 'resolved', 'closed'].includes(ticket.status);
    const hasValidPriority = ticket.priority !== null && 
      ['low', 'medium', 'high', 'urgent'].includes(ticket.priority);
    
    return (
      ticket.customer_id === currentUser?.id &&
      hasValidStatus &&
      hasValidPriority
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tickets"
        description="View and track your support tickets"
      />
      
      <TicketList 
        tickets={customerTickets}
        loading={isLoading}
        showAssignee={true}
        showCustomer={false}
      />
    </div>
  );
};

export default CustomerTickets; 
