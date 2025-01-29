import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useUserStore } from '@/stores/userStore';
import { useTicketStore } from '@/stores/ticketStore';
import { TicketList } from '../components/TicketList';
import { Button } from '@/components/ui/button';
import { AdminLayout, AgentLayout, PortalLayout } from '@/components/layout';
import type { UserRole } from '@/types';

export default function TicketsPage() {
  const [, setLocation] = useLocation();
  const { currentUser } = useUserStore();
  const { tickets, isLoading, error, fetchTickets } = useTicketStore();

  useEffect(() => {
    if (currentUser?.organization_id) {
      fetchTickets();
    }
  }, [currentUser?.organization_id, fetchTickets]);

  if (!currentUser) {
    return null; // or redirect to login
  }

  const handleTicketSelect = (ticketId: string) => {
    setLocation(`/tickets/${ticketId}`);
  };

  const LayoutComponent = {
    admin: AdminLayout,
    head_admin: AdminLayout,
    agent: AgentLayout,
    customer: PortalLayout
  }[currentUser.role] || PortalLayout;

  return (
    <LayoutComponent>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {currentUser.role === 'customer' ? 'My Tickets' : 'All Tickets'}
          </h1>
          {currentUser.role !== 'customer' && (
            <Button onClick={() => setLocation('/tickets/new')}>
              Create Ticket
            </Button>
          )}
        </div>

        <TicketList
          tickets={tickets}
          loading={isLoading}
          showAssignee={currentUser.role !== 'customer'}
          showCustomer={currentUser.role !== 'customer'}
          onTicketSelect={handleTicketSelect}
        />
      </div>
    </LayoutComponent>
  );
} 
