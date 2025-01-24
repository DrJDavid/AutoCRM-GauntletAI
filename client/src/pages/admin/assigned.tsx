import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUserStore } from "@/stores/userStore";
import { useTicketStore } from "@/stores/ticketStore";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

export default function AdminAssigned() {
  const [location, setLocation] = useLocation();
  const { currentUser } = useUserStore();
  const { tickets, isLoading, error, fetchTickets } = useTicketStore();

  useEffect(() => {
    if (currentUser?.organization_id) {
      fetchTickets();
    }
  }, [currentUser?.organization_id, fetchTickets]);

  const handleUnassign = async (e: React.MouseEvent, ticketId: string) => {
    e.stopPropagation();

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_agent_id: null })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket unassigned successfully",
      });

      fetchTickets();
    } catch (error) {
      console.error('Error unassigning ticket:', error);
      toast({
        title: "Error",
        description: "Failed to unassign ticket",
        variant: "destructive",
      });
    }
  };

  // Filter tickets assigned to the current admin
  const assignedTickets = tickets.filter(ticket => 
    ticket.assigned_agent_id === currentUser?.id
  ).sort((a, b) => {
    // Sort by status first (in_progress before open)
    if (a.status !== b.status) {
      return a.status === 'in_progress' ? -1 : 1;
    }
    
    // Then by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Finally by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h3 className="font-semibold">Error Loading Tickets</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage tickets assigned to you
          </p>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignedTickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                className="cursor-pointer"
                onClick={() => setLocation(`/admin/tickets/${ticket.id}`)}
              >
                <TableCell className="font-medium">{ticket.id}</TableCell>
                <TableCell>{ticket.title}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      ticket.status === "open"
                        ? "default"
                        : ticket.status === "in_progress"
                        ? "secondary"
                        : "success"
                    }
                  >
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      ticket.priority === "high"
                        ? "destructive"
                        : ticket.priority === "medium"
                        ? "warning"
                        : "default"
                    }
                  >
                    {ticket.priority}
                  </Badge>
                </TableCell>
                <TableCell>{ticket.customer?.email || "Unknown"}</TableCell>
                <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/admin/tickets/${ticket.id}`);
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleUnassign(e, ticket.id)}
                    >
                      Unassign
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
