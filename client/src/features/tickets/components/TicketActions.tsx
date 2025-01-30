import { FC } from 'react';
import { useTicketStore } from '@/stores/ticketStore';
import { useUserStore } from '@/stores/userStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from '@/components/ui/use-toast';
import { MoreHorizontal, UserPlus } from 'lucide-react';
import type { Ticket } from '../types';

interface TicketActionsProps {
  ticket: Ticket;
  mode: 'admin' | 'agent' | 'customer';
  canAssign: boolean;
  canChangeStatus: boolean;
  canChangePriority: boolean;
}

export const TicketActions: FC<TicketActionsProps> = ({
  ticket,
  mode,
  canAssign,
  canChangeStatus,
  canChangePriority,
}) => {
  const { updateTicket } = useTicketStore();
  const { currentUser } = useUserStore();

  const handleStatusChange = async (newStatus: typeof ticket.status) => {
    try {
      await updateTicket(ticket.id, { 
        status: newStatus,
        ...(newStatus === 'closed' ? { closed_at: new Date().toISOString() } : {})
      });
      toast({
        title: "Status Updated",
        description: `Ticket status changed to ${newStatus.replace('_', ' ')}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive"
      });
    }
  };

  const handlePriorityChange = async (newPriority: typeof ticket.priority) => {
    try {
      await updateTicket(ticket.id, { priority: newPriority });
      toast({
        title: "Priority Updated",
        description: `Ticket priority changed to ${newPriority}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket priority",
        variant: "destructive"
      });
    }
  };

  const handleAssignToMe = async () => {
    if (!currentUser) return;
    
    try {
      await updateTicket(ticket.id, { 
        assigned_to: currentUser.id,
        status: ticket.status === 'open' ? 'in_progress' : ticket.status
      });
      toast({
        title: "Ticket Assigned",
        description: "Ticket has been assigned to you"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign ticket",
        variant: "destructive"
      });
    }
  };

  const handleUnassign = async () => {
    try {
      await updateTicket(ticket.id, { assigned_to: null });
      toast({
        title: "Ticket Unassigned",
        description: "Ticket assignment has been removed"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unassign ticket",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex gap-2">
      {canChangeStatus && (
        <Select
          value={ticket.status}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      )}

      {canChangePriority && (
        <Select
          value={ticket.priority}
          onValueChange={handlePriorityChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      )}

      {canAssign && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!ticket.assigned_to && (
              <DropdownMenuItem onClick={handleAssignToMe}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign to me
              </DropdownMenuItem>
            )}
            {ticket.assigned_to && mode === 'admin' && (
              <DropdownMenuItem onClick={handleUnassign}>
                Unassign ticket
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}; 