import type { DbProfile } from '@/types/database';
import type { Json } from '@/types/supabase';
import type { Database } from '@/types/supabase';

// Re-export enums from database
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'pending';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'account' | 'billing' | 'technical_issue' | 'other';

// Base ticket type that matches database schema
export type DbTicket = Database['public']['Tables']['tickets']['Row'];

// Frontend ticket type with required fields
export interface Ticket extends DbTicket {
  status: TicketStatus;
  priority: TicketPriority;
  customer?: DbProfile;
  assigned_agent?: DbProfile;
}

// Message types
export type DbTicketMessage = Database['public']['Tables']['ticket_messages']['Row'];

export interface TicketMessage extends DbTicketMessage {
  is_internal: boolean;
  sender?: DbProfile;
}

// Filter types
export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  customer_id?: string;
  assigned_to?: string;
}

// Form types
export interface CreateTicketForm {
  title: string;
  description: string;
  priority: TicketPriority;
}

export interface UpdateTicketForm {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigned_to?: string | null;
}

// Component Props
export interface TicketListProps {
  tickets: Ticket[];
  onTicketSelect?: (ticketId: string) => void;
  loading?: boolean;
  showAssignee?: boolean;
  showCustomer?: boolean;
}

export interface TicketDetailProps {
  ticket: Ticket;
  messages: TicketMessage[];
  onStatusChange: (status: TicketStatus) => void;
}

export interface TicketFormProps {
  onSubmit: (data: CreateTicketForm) => Promise<void>;
  initialData?: Partial<Ticket>;
} 