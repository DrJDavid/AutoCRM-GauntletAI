import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/userStore";
import { Loader2, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateTicketForm } from "./components/CreateTicketForm";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Ticket } from "@/types/database";

/**
 * CustomerPortal component serves as the main dashboard for customers
 * Features:
 * - Overview of ticket statistics
 * - Create new tickets
 * - View existing tickets
 * - Search functionality
 */
export default function CustomerPortal() {
  const { currentUser, isLoading } = useUserStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createTicketOpen, setCreateTicketOpen] = useState(false);

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
  }, [currentUser?.id]);

  // Filter tickets based on search query
  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate ticket statistics
  const openTickets = tickets.filter(t => ['open', 'in_progress'].includes(t.status));
  const resolvedTickets = tickets.filter(t => ['resolved', 'closed'].includes(t.status));

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
    <div className="p-8">
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
            <CreateTicketForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Tickets Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Your Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tickets.length}</div>
            <p className="text-sm text-gray-500">
              {openTickets.length} open, {resolvedTickets.length} resolved
            </p>
          </CardContent>
        </Card>

        {/* Search Box */}
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search tickets..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {ticketsLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          </div>
        ) : filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => (
            <Link key={ticket.id} href={`/portal/tickets/${ticket.id}`}>
              <Card className="hover:bg-gray-50 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{ticket.title}</CardTitle>
                      <p className="text-sm text-gray-500">
                        Created on {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        ticket.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                        ticket.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                        ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 line-clamp-2">{ticket.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'No tickets found matching your search' : 'No tickets yet'}
          </div>
        )}
      </div>
    </div>
  );
}