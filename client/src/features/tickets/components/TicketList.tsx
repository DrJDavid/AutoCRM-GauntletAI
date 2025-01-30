import { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import type { TicketListProps } from '../types';

export const TicketList: FC<TicketListProps> = ({
  tickets,
  onTicketSelect,
  loading = false,
  showAssignee = false,
  showCustomer = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (!tickets?.length) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No tickets found</p>
      </Card>
    );
  }

  const handleTicketClick = (ticketId: string) => {
    if (onTicketSelect) {
      onTicketSelect(ticketId);
    }
  };

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card
          key={ticket.id}
          className="p-4 hover:bg-accent cursor-pointer transition-colors"
          onClick={() => handleTicketClick(ticket.id)}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium">{ticket.title}</h3>
              {ticket.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {ticket.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge
                variant={
                  ticket.status === 'open'
                    ? 'default'
                    : ticket.status === 'in_progress'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {ticket.status.replace('_', ' ')}
              </Badge>
              <Badge
                variant={
                  ticket.priority === 'urgent'
                    ? 'destructive'
                    : ticket.priority === 'high'
                    ? 'default'
                    : 'secondary'
                }
              >
                {ticket.priority}
              </Badge>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex gap-4">
              {showCustomer && ticket.customer && (
                <span>Customer: {ticket.customer.email}</span>
              )}
              {showAssignee && ticket.assigned_agent && (
                <span>Assigned to: {ticket.assigned_agent.email}</span>
              )}
            </div>
            {ticket.created_at && (
              <span>
                Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}; 
