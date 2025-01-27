import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function AdminTickets() {
  const [location, setLocation] = useLocation();
  const { currentUser } = useUserStore();
  const { tickets, isLoading, error, fetchTickets } = useTicketStore();

  useEffect(() => {
    if (currentUser?.organization_id) {
      fetchTickets();
    }
  }, [currentUser?.organization_id, fetchTickets]);

  const handleAssignToMe = async (e: React.MouseEvent, ticketId: string) => {
    e.stopPropagation();
    if (!currentUser?.id) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_agent_id: currentUser.id })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket assigned successfully",
      });

      // Refresh tickets
      fetchTickets();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: "Error",
        description: "Failed to assign ticket",
        variant: "destructive",
      });
    }
  };

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
        <h1 className="text-3xl font-bold">All Tickets</h1>
        <Button onClick={() => setLocation("/admin/tickets/new")}>Create Ticket</Button>
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
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
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
                <TableCell>
                  {ticket.assigned_to?.email || (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleAssignToMe(e, ticket.id)}
                    >
                      Assign to me
                    </Button>
                  )}
                </TableCell>
                <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}