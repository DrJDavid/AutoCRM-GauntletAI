import { FC } from 'react';
import { TicketDetails } from '@/features/tickets/components/TicketDetails';

const CustomerTicketDetailsPage: FC = () => {
  return (
    <div className="container mx-auto py-6">
      <TicketDetails mode="customer" />
    </div>
  );
};

export default CustomerTicketDetailsPage;
