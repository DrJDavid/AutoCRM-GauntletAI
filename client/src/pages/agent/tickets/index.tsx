import { FC } from 'react';
import { useTicketStore } from '@/stores/ticketStore';
import { TicketList } from '@/components/tickets/TicketList';
import { PageHeader } from '@/components/ui/page-header';

const AgentTickets: FC = () => {
  const { tickets, loading } = useTicketStore();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets"
        description="View and manage your assigned tickets"
      />
      
      <TicketList 
        tickets={tickets}
        loading={loading}
        showAssignee={false}
        showCustomer={true}
      />
    </div>
  );
};

export default AgentTickets; 