/**
 * Core type definitions for the application
 * Re-exports database types and defines frontend-specific types
 */

import type {
  DbProfile as Profile,
  DbTicket as Ticket,
  DbTicketMessage as TicketMessage,
  DbTicketAttachment as Attachment,
  TicketPriority,
  TicketStatus,
  UserRole,
  DbOrganization as Organization,
} from './database';

// Re-export all types from database.ts
export * from './database';

// Re-export all types from forms.ts
export * from './forms';

// Re-export Database type from supabase.ts
export type { Database } from './supabase';

// Re-export renamed types
export type {
  Profile,
  Ticket,
  TicketMessage,
  Attachment,
  TicketPriority,
  TicketStatus,
  UserRole,
  Organization,
};

// ==================== Relationship Types ====================

export interface ProfileWithOrganization extends Profile {
  organization: Organization;
}

export interface TicketWithRelations extends Omit<Ticket, 'customer' | 'assigned_agent'> {
  customer: Profile;
  assigned_agent?: Profile;
  messages: TicketMessage[];
  attachments?: Attachment[];
}

export interface TicketMessageWithRelations extends TicketMessage {
  author: Profile;
  attachments?: Attachment[];
}

// ==================== Frontend-Specific Types ====================

// Form Types
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
  assigned_agent_id?: string | null;
}

// Component Props Types
export interface TicketListProps {
  tickets: TicketWithRelations[];
  onTicketSelect: (ticketId: string) => void;
}

export interface TicketDetailProps {
  ticket: TicketWithRelations;
  onStatusChange?: (newStatus: TicketStatus) => void;
}

export interface TicketFormProps {
  onSubmit: (data: CreateTicketForm) => Promise<void>;
  initialData?: Partial<Ticket>;
}

// Filter Types
export interface TicketFilters {
  priority?: TicketPriority[];
  status?: TicketStatus[];
  assignedTo?: string[];
  customer?: string[];
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
}

export interface PaginationState {
  page: number;
  perPage: number;
  total: number;
}

// Utility Types
export type WithLoadingState<T> = T & LoadingState;
export type WithPagination<T> = T & { pagination: PaginationState };