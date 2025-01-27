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

interface TicketListProps {
  tickets: DbTicket[];
  onTicketSelect: (ticketId: string) => void;
}

export function TicketList({ tickets, onTicketSelect }: TicketListProps) {
  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [tickets]);

  const getPriorityColor = (priority: DbTicket['priority']) => {
    const colors = {
      low: 'text-gray-500',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority];
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTickets.map((ticket) => (
          <TableRow
            key={ticket.id}
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => onTicketSelect(ticket.id)}
          >
            <TableCell>
              <Link href={`/tickets/${ticket.id}`} className="hover:underline">
                {ticket.title}
              </Link>
            </TableCell>
            <TableCell>
              <StatusBadge status={ticket.status} />
            </TableCell>
            <TableCell>
              <span className={getPriorityColor(ticket.priority)}>
                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
              </span>
            </TableCell>
            <TableCell className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
            </TableCell>
            <TableCell className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
