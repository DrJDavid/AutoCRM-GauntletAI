import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/userStore";
import { Loader2, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateTicketForm } from "./components/CreateTicketForm";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Ticket } from "@/types/database";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useLocation } from 'wouter';
import { Badge } from "@/components/ui/badge";

/**
 * CustomerPortal component serves as the main dashboard for customers
 * Features:
 * - Overview of ticket statistics
 * - Create new tickets
 * - View existing tickets with click-through to details
 * - Search functionality
 */
export default function CustomerPortal() {
  const { currentUser, isLoading } = useUserStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch tickets for the current user
  useEffect(() => {
    async function fetchTickets() {
      if (!currentUser?.id) return;

      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('customer_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTickets(data || []);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setTicketsLoading(false);
      }
    }

    fetchTickets();

    // Set up realtime subscription for ticket updates
    const channel = supabase
      .channel('tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `customer_id=eq.${currentUser?.id}`,
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // Filter tickets based on search query
  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate ticket statistics
  const openTickets = tickets.filter(t => ['open', 'in_progress'].includes(t.status));
  const resolvedTickets = tickets.filter(t => ['resolved', 'closed'].includes(t.status));

  // Handle ticket click
  const handleTicketClick = (ticketId: string) => {
    setLocation(`/portal/tickets/${ticketId}`);
  };

  const statusColors = {
    open: 'bg-green-500/10 text-green-500',
    in_progress: 'bg-yellow-500/10 text-yellow-500',
    resolved: 'bg-blue-500/10 text-blue-500',
    closed: 'bg-gray-500/10 text-gray-500',
  } as const;

  const priorityColors = {
    low: 'bg-blue-500/10 text-blue-500',
    medium: 'bg-yellow-500/10 text-yellow-500',
    high: 'bg-orange-500/10 text-orange-500',
    urgent: 'bg-red-500/10 text-red-500',
  } as const;

  const categoryColors = {
    account: 'bg-purple-500/10 text-purple-500',
    billing: 'bg-emerald-500/10 text-emerald-500',
    technical_issue: 'bg-cyan-500/10 text-cyan-500',
    other: 'bg-gray-500/10 text-gray-500',
  } as const;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Support Portal</h1>
          <p className="text-gray-500">Welcome back, {currentUser.email}</p>
        </div>
        <Dialog open={createTicketOpen} onOpenChange={setCreateTicketOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Support Ticket</DialogTitle>
            </DialogHeader>
            <CreateTicketForm onSuccess={() => setCreateTicketOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Tickets Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tickets.length}</div>
            <p className="text-gray-500">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{openTickets.length}</div>
            <p className="text-gray-500">Awaiting resolution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resolved Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{resolvedTickets.length}</div>
            <p className="text-gray-500">Successfully closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Tickets List */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search tickets..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {ticketsLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map((ticket) => (
              <Card 
                key={ticket.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleTicketClick(ticket.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{ticket.title}</CardTitle>
                      <p className="text-sm text-gray-500">
                        Created on {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex gap-2">
                        <Badge variant="secondary" className={priorityColors[ticket.priority]}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant="secondary" className={statusColors[ticket.status]}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className={categoryColors[ticket.category]}>
                        {ticket.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  {ticket.description && (
                    <p className="text-gray-600 mt-2 line-clamp-2">
                      {ticket.description}
                    </p>
                  )}
                </CardHeader>
              </Card>
            ))}

            {filteredTickets.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No tickets found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}