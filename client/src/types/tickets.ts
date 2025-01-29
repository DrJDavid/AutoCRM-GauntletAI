import type { DbTicket, DbProfile, DbTicketMessage, TicketStatus, TicketPriority, TicketCategory } from './database';

// Re-export database enums for convenience
export { type TicketStatus, type TicketPriority, type TicketCategory };

// Base ticket interface that extends database ticket
export interface Ticket extends Omit<DbTicket, 'current_description'> {
  description: string; // Frontend uses 'description' instead of 'current_description'
}

// Ticket with all relations loaded
export interface TicketWithRelations extends DbTicket {
  customer: DbProfile;
  assigned_agent?: DbProfile;
  messages: DbTicketMessage[];
}

// Form interfaces
export interface CreateTicketForm {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
}

export interface UpdateTicketForm {
  title?: string;
  current_description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigned_agent_id?: string | null;
}

// Component Props
export interface TicketListProps {
  tickets: DbTicket[];
  onTicketSelect: (ticketId: string) => void;
}

export interface TicketDetailProps {
  ticket: DbTicket;
  messages?: DbTicketMessage[];
  onStatusChange: (newStatus: TicketStatus) => void;
}

export interface TicketFormProps {
  onSubmit: (data: CreateTicketForm) => Promise<void>;
  initialData?: Partial<DbTicket>;
}

// Utility type for ticket filters
export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedTo?: string[];
}

// Type guard functions
export function isTicket(obj: unknown): obj is DbTicket {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'current_description' in obj
  );
}

export function isTicketWithRelations(obj: unknown): obj is TicketWithRelations {
  return (
    isTicket(obj) &&
    'customer' in obj &&
    typeof obj.customer === 'object' &&
    obj.customer !== null
  );
} 