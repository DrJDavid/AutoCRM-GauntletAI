import { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { 
  TicketDetailProps, 
  TicketMessage, 
  TicketStatus, 
  TicketPriority 
} from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const TicketDetail: FC<TicketDetailProps> = ({
  ticket,
  messages,
  onStatusChange,
}) => {
  const renderMessage = (message: TicketMessage) => (
    <div key={message.id} className="flex gap-4 mb-4">
      <Avatar>
        {message.author?.email?.charAt(0).toUpperCase() || 'U'}
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">
            {message.author?.email || 'Unknown User'}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {message.is_internal && (
            <Badge variant="secondary">Internal Note</Badge>
          )}
        </div>
        <p className="text-gray-700">{message.content}</p>
      </div>
    </div>
  );

  const getStatusBadgeVariant = (status: TicketStatus): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case 'open':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'resolved':
        return 'destructive';
      case 'closed':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority: TicketPriority): "default" | "secondary" | "outline" | "destructive" => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{ticket.title}</h2>
            <div className="flex gap-2 items-center">
              <Badge variant={getStatusBadgeVariant(ticket.status)}>
                {ticket.status}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                {ticket.priority}
              </Badge>
              <Badge variant="secondary">{ticket.category}</Badge>
            </div>
          </div>
          <div className="space-x-2">
            <Select
              value={ticket.status}
              onValueChange={onStatusChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {ticket.customer && (
          <div className="border-t mt-4 pt-4">
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="flex items-center gap-2">
              <Avatar>
                {ticket.customer.email.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <p className="font-medium">{ticket.customer.email}</p>
                {ticket.customer.full_name && (
                  <p className="text-sm text-muted-foreground">
                    {ticket.customer.full_name}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {ticket.assigned_agent && (
          <div className="border-t mt-4 pt-4">
            <h3 className="font-semibold mb-2">Assigned Agent</h3>
            <div className="flex items-center gap-2">
              <Avatar>
                {ticket.assigned_agent.email.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <p className="font-medium">{ticket.assigned_agent.email}</p>
                {ticket.assigned_agent.full_name && (
                  <p className="text-sm text-muted-foreground">
                    {ticket.assigned_agent.full_name}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Messages</h3>
        <div className="space-y-4">
          {messages.map(renderMessage)}
        </div>
      </Card>
    </div>
  );
}; 