/**
 * Core type definitions for the application
 * These types are derived from our Supabase database schema
 */

import { Json } from './database';

// ==================== User & Profile Types ====================

export interface Profile {
  id: string;
  email: string;
  organization_id: string | null;
  role: 'admin' | 'agent' | 'customer';
  created_at: string;
  updated_at: string;
}

// ==================== Ticket Types ====================

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  content_type: string;
  storage_path: string;
  ticket_id: string | null;
  comment_id: string | null;
  organization_id: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  customer_id: string;
  assigned_agent_id: string | null;
  organization_id: string;
  tags: string[] | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
}

// Form value types (for creating/updating)
export type CreateTicketForm = Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'attachments'>;
export type UpdateTicketForm = Partial<CreateTicketForm>;

// ==================== Message Types ====================

export interface Message {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// ==================== Component Props Types ====================

export interface TicketListProps {
  tickets: Ticket[];
  onTicketSelect: (ticketId: string) => void;
}

export interface TicketDetailProps {
  ticket: Ticket;
  messages: Message[];
  onStatusChange?: (newStatus: TicketStatus) => void;
}

export interface TicketFormProps {
  onSubmit: (data: CreateTicketForm) => Promise<void>;
  initialData?: Partial<Ticket>;
}

// ==================== Filter Types ====================

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  assignedTo?: string[];
  tags?: string[];
}