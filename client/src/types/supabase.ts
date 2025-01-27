/**
 * Re-exports and extends types from Supabase database schema
 * This file serves as the single source of truth for database-related types in the frontend
 */

import type { Database } from '@/../../supabase/types/database.types';

// Export the main Database type
export type { Database };

// Table row types
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type TicketMessage = Database['public']['Tables']['ticket_messages']['Row'];
export type TicketAttachment = Database['public']['Tables']['ticket_attachments']['Row'];
export type TicketVersion = Database['public']['Tables']['ticket_versions']['Row'];

// Enum types
export type UserRole = Database['public']['Enums']['user_role'];
export type TicketCategory = Database['public']['Enums']['ticket_category'];
export type TicketPriority = Database['public']['Enums']['ticket_priority'];

// Extended types for frontend use
export interface ProfileWithOrganization extends Profile {
  organization?: Organization;
}

export interface TicketWithRelations extends Ticket {
  customer?: Profile;
  assigned_agent?: Profile;
  messages?: TicketMessage[];
  attachments?: TicketAttachment[];
  versions?: TicketVersion[];
}

export interface TicketMessageWithRelations extends TicketMessage {
  author?: Profile;
  attachments?: TicketAttachment[];
}

// Function argument types
export type CreateOrganizationArgs = Database['public']['Functions']['create_organization_with_admin']['Args'];
export type TransferHeadAdminArgs = Database['public']['Functions']['transfer_head_admin']['Args'];
