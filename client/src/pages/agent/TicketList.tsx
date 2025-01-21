import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useTicketStore } from '@/stores/ticketStore';
import { useUserStore } from '@/stores/userStore';
import { 
  Card,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button
} from '@/components/ui';
import { Loader2, Search } from 'lucide-react';

type TicketStatus = 'new' | 'pending' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export default function TicketList() {
  const [location] = useLocation();
  const { currentUser } = useUserStore();
  const { tickets, isLoading, error, fetchTickets } = useTicketStore();
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');

  // Get priority from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const urlPriority = params.get('priority');
    if (urlPriority) {
      setPriorityFilter(urlPriority as TicketPriority);
    }
  }, [location]);

  useEffect(() => {
    if (currentUser?.organization) {
      fetchTickets();
    }
  }, [currentUser?.organization, fetchTickets]);

  // Filter tickets based on search and filters
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center text-red-500">
          Error loading tickets: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tickets</h1>
        <Button>Create Ticket</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as TicketStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(value) => setPriorityFilter(value as TicketPriority | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tickets found matching your filters.
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="p-4 hover:bg-muted/50 cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{ticket.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ticket.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {ticket.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    ticket.status === 'new' ? 'bg-blue-100 text-blue-700' :
                    ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 