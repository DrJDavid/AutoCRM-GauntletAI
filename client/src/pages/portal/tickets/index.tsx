import { FC } from 'react';
import { useTicketStore } from '@/stores/ticketStore';
import { TicketList } from '@/components/tickets/TicketList';
import { PageHeader } from '@/components/ui';
import { useUserStore } from '@/stores/userStore';

const CustomerTickets: FC = () => {
  const { currentUser } = useUserStore();
  const { tickets, isLoading } = useTicketStore();

  // Filter tickets to only show the current customer's tickets
  const customerTickets = tickets.filter(
    ticket => ticket.customer_id === currentUser?.id
  );

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
