/**
 * Core type definitions for the application
 * Re-exports database types and defines frontend-specific types
 */

import type {
  Profile as DbProfile,
  ProfileWithOrganization,
  Ticket as DbTicket,
  TicketWithRelations,
  TicketMessage,
  TicketMessageWithRelations,
  TicketAttachment,
  TicketPriority,
  TicketCategory,
  UserRole,
} from './supabase';

// Re-export database types
export type {
  DbProfile,
  ProfileWithOrganization,
  DbTicket,
  TicketWithRelations,
  TicketMessage,
  TicketMessageWithRelations,
  TicketAttachment,
  TicketPriority,
  TicketCategory,
  UserRole,
};

// ==================== Frontend-Specific Types ====================

// Form Types
export interface CreateTicketForm {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
}

export interface UpdateTicketForm {
  title?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  assigned_agent_id?: string | null;
}

// Component Props Types
export interface TicketListProps {
  tickets: TicketWithRelations[];
  onTicketSelect: (ticketId: string) => void;
}

export interface TicketDetailProps {
  ticket: TicketWithRelations;
  onStatusChange?: (newStatus: string) => void;
}

export interface TicketFormProps {
  onSubmit: (data: CreateTicketForm) => Promise<void>;
  initialData?: Partial<DbTicket>;
}

// Filter Types
export interface TicketFilters {
  category?: TicketCategory[];
  priority?: TicketPriority[];
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