import { FC } from 'react';
import { useTicketStore } from '@/stores/ticketStore';
import { TicketList } from '@/features/tickets';
import { PageHeader } from '@/components/ui/page-header';
import { useLocation } from 'wouter';

const AgentTickets: FC = () => {
  const { tickets, isLoading } = useTicketStore();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets"
        description="View and manage your assigned tickets"
      />
      
      <TicketList 
        tickets={tickets}
        loading={isLoading}
        showAssignee={false}
        showCustomer={true}
      />
    </div>
  );
};

export default AgentTickets; 