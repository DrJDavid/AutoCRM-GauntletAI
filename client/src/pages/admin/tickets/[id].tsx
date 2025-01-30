import { FC } from 'react';
import { TicketDetails } from '@/features/tickets/components/TicketDetails';

const AdminTicketDetailsPage: FC = () => {
  return (
    <div className="container mx-auto py-6">
      <TicketDetails mode="admin" />
    </div>
  );
};

export default AdminTicketDetailsPage; 
