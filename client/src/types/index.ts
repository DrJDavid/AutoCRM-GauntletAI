export type UserRole = 'customer' | 'agent' | 'admin';

export type User = {
  id: string;
  email: string;
  role: UserRole;
};

export type Ticket = {
  id: string;
  title: string;
  description: string;
  customerId: string;
  assignedAgentId: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed';
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type TicketMessage = {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  attachments: string[];
  createdAt: string;
};

export type TicketFilters = {
  status?: string[];
  priority?: string[];
  assignedTo?: string[];
  tags?: string[];
};

export type TicketListProps = {
  tickets: Ticket[];
  onTicketSelect: (ticketId: string) => void;
};

export type TicketDetailProps = {
  ticket: Ticket;
  messages: TicketMessage[];
};

export type TicketFormProps = {
  onSubmit: (data: Partial<Ticket>) => void;
  initialData?: Partial<Ticket>;
};