import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { TicketWithRelations } from "@/types/tickets";
import type { Database } from "@/types/supabase";

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  customer: { email: string } | null;
  assigned_agent: { email: string } | null;
};

export default function AdminTickets() {
  const location = useLocation();
  const navigate = useNavigate();
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
        .update({ assigned_to: currentUser.id })
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
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
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
        <Button onClick={() => navigate("/admin/tickets/new")}>Create Ticket</Button>
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
            {(tickets as Ticket[]).map((ticket) => (
              <TableRow
                key={ticket.id}
                className="cursor-pointer"
                onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
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
                        : "destructive"
                    }
                  >
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      ticket.priority === "urgent"
                        ? "destructive"
                        : ticket.priority === "high"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {ticket.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {ticket.customer?.email || 'No customer email'}
                </TableCell>
                <TableCell>
                  {ticket.assigned_agent?.email || (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleAssignToMe(e, ticket.id)}
                    >
                      Assign to me
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/tickets/${ticket.id}`);
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