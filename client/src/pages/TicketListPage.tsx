import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketStore } from '@/stores/ticketStore';
import { TicketList } from '@/features/tickets';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { DbTicket, TicketStatus, TicketPriority } from '@/types/database';
import type { Ticket } from '@/features/tickets/types';

interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
}

// Transform database ticket to frontend ticket
const toFrontendTicket = (dbTicket: DbTicket): Ticket => ({
  ...dbTicket,
  status: dbTicket.status || 'open',
  priority: dbTicket.priority || 'low',
});

export default function TicketListPage() {
  const navigate = useNavigate();
  const { tickets, fetchTickets, setFilters, isLoading, error: ticketError } = useTicketStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<TicketFilters>({});

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleFilterChange = (key: keyof TicketFilters, value: TicketStatus | TicketPriority | undefined) => {
    const newFilters: TicketFilters = { 
      ...activeFilters, 
      [key]: value ? [value] : undefined 
    };
    setActiveFilters(newFilters);
    setFilters(newFilters);
  };

  // Filter tickets and transform to frontend type
  const filteredTickets = tickets
    .filter((ticket) => {
      if (!ticket.title) return false;
      return ticket.title.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .map(toFrontendTicket);

  if (ticketError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{ticketError.message}</p>
          <Button onClick={() => fetchTickets()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <Button onClick={() => navigate('/tickets/new')}>
          Create Ticket
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select
                onValueChange={(value: TicketStatus | '') => 
                  handleFilterChange('status', value || undefined)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select
                onValueChange={(value: TicketPriority | '') =>
                  handleFilterChange('priority', value || undefined)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading tickets...</p>
              </div>
            </div>
          ) : (
            <TicketList
              tickets={filteredTickets}
              onTicketSelect={(id) => navigate(`/tickets/${id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
