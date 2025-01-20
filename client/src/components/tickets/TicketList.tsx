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
import type { Ticket, TicketListProps } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export function TicketList({ tickets, onTicketSelect }: TicketListProps) {
  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [tickets]);

  const getPriorityColor = (priority: Ticket['priority']) => {
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
              {ticket.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {ticket.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
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
              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
            </TableCell>
            <TableCell className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
