import { FC } from 'react';
import { TicketDetails } from '@/features/tickets/components/TicketDetails';

const AgentTicketDetailsPage: FC = () => {
  return (
    <div className="container mx-auto py-6">
      <TicketDetails mode="agent" />
    </div>
  );
};

export default AgentTicketDetailsPage;
