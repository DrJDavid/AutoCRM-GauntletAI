import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
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
import type { TicketFilters, TicketStatus, TicketPriority } from '@/types';

export default function TicketListPage() {
  const [, setLocation] = useLocation();
  const { tickets, fetchTickets, setFilters, isLoading } = useTicketStore();
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

  const filteredTickets = tickets.filter((ticket) =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <Button onClick={() => setLocation('/tickets/new')}>
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
            <div>Loading...</div>
          ) : (
            <TicketList
              tickets={filteredTickets}
              onTicketSelect={(id) => setLocation(`/tickets/${id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
