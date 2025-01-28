import { useMemo } from 'react';
import { Link } from 'wouter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { DbTicket } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { FC } from 'react';
import { Ticket } from '@/types/supabase';
import { Skeleton } from '@/components/ui/skeleton';

interface TicketListProps {
  tickets: Ticket[];
  loading?: boolean;
  showAssignee?: boolean;
  showCustomer?: boolean;
}

export const TicketList: FC<TicketListProps> = ({
  tickets,
  loading = false,
  showAssignee = true,
  showCustomer = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!tickets?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tickets found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="p-4 border rounded-lg hover:bg-muted/50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{ticket.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {ticket.description}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {ticket.status}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                ticket.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {ticket.priority}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
