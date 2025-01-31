/**
 * Database Types
 * This file contains TypeScript types generated from our Supabase database schema.
 * These types ensure type safety when interacting with the database through Supabase client.
 */

import type { Database } from './supabase';

// Re-export the Json type
export type { Json } from './supabase';

/**
 * Enum Types
 * These types represent the valid values for various enum fields in the database
 */
export type UserRole = Database['public']['Enums']['user_role'];
export type TicketStatus = Database['public']['Enums']['ticket_status'];
export type TicketPriority = Database['public']['Enums']['ticket_priority'];
export type InvitationType = Database['public']['Enums']['invitation_type'];
export type InvitationStatus = Database['public']['Enums']['invitation_status'];

/**
 * Base Table Types
 * Direct mappings to database table rows
 */
export type DbOrganization = Database['public']['Tables']['organizations']['Row'];
export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbTicket = Database['public']['Tables']['tickets']['Row'];
export type DbTicketMessage = Database['public']['Tables']['ticket_messages']['Row'];
export type DbTicketAttachment = Database['public']['Tables']['ticket_attachments']['Row'];
export type DbAiAgent = Database['public']['Tables']['ai_agents']['Row'];
export type DbAiAgentAssignment = Database['public']['Tables']['ai_agent_assignments']['Row'];
export type DbAiAgentResponse = Database['public']['Tables']['ai_agent_responses']['Row'];
export type DbInvitation = Database['public']['Tables']['invitations']['Row'];

/**
 * Insert Types
 * Types for inserting new records into database tables
 */
export type DbOrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
export type DbProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type DbTicketInsert = Database['public']['Tables']['tickets']['Insert'];
export type DbTicketMessageInsert = Database['public']['Tables']['ticket_messages']['Insert'];
export type DbTicketAttachmentInsert = Database['public']['Tables']['ticket_attachments']['Insert'];
export type DbAiAgentInsert = Database['public']['Tables']['ai_agents']['Insert'];
export type DbAiAgentAssignmentInsert = Database['public']['Tables']['ai_agent_assignments']['Insert'];
export type DbAiAgentResponseInsert = Database['public']['Tables']['ai_agent_responses']['Insert'];
export type DbInvitationInsert = Database['public']['Tables']['invitations']['Insert'];

/**
 * Update Types
 * Types for updating existing records in database tables
 */
export type DbOrganizationUpdate = Database['public']['Tables']['organizations']['Update'];
export type DbProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type DbTicketUpdate = Database['public']['Tables']['tickets']['Update'];
export type DbTicketMessageUpdate = Database['public']['Tables']['ticket_messages']['Update'];
export type DbTicketAttachmentUpdate = Database['public']['Tables']['ticket_attachments']['Update'];
export type DbAiAgentUpdate = Database['public']['Tables']['ai_agents']['Update'];
export type DbAiAgentAssignmentUpdate = Database['public']['Tables']['ai_agent_assignments']['Update'];
export type DbAiAgentResponseUpdate = Database['public']['Tables']['ai_agent_responses']['Update'];
export type DbInvitationUpdate = Database['public']['Tables']['invitations']['Update'];

/**
 * Function Return Types
 * Types for database function return values
 */
export type GetUserRole = Database['public']['Functions']['get_user_role']['Returns'];
export type GetUserOrganizationId = Database['public']['Functions']['get_user_organization_id']['Returns'];
export type GetTicketStats = Database['public']['Functions']['get_ticket_stats']['Returns'];
export type GetAgentPerformance = Database['public']['Functions']['get_agent_performance']['Returns'];
export type ValidateInviteByEmail = Database['public']['Functions']['validate_invite_by_email']['Returns'];
export type AcceptInvitation = Database['public']['Functions']['accept_invitation']['Returns'];
export type AssignTicket = Database['public']['Functions']['assign_ticket']['Returns'];
export type CloseTicket = Database['public']['Functions']['close_ticket']['Returns'];

/**
 * Extended Types with Relations
 * These types extend the base table types with their relationships
 */

/**
 * Extended ticket type with all possible relations and AI metadata
 */
export interface TicketWithRelations extends DbTicket {
  customer: DbProfile;
  assigned_agent?: DbProfile;
  messages?: DbTicketMessage[];
  attachments?: DbTicketAttachment[];
  ai_metadata?: {
    classification?: {
      category: string;
      subcategory: string;
      tags: string[];
    };
    sentiment?: {
      score: number;
      label: 'positive' | 'negative' | 'neutral';
      confidence: number;
    };
    priority_score?: number;
    suggested_templates?: string[];
    suggested_articles?: string[];
  };
}

/**
 * Extended ticket message type with sender and AI analysis
 */
export interface TicketMessageWithRelations extends DbTicketMessage {
  sender: DbProfile;
  attachments?: DbTicketAttachment[];
  ai_metadata?: {
    sentiment?: {
      score: number;
      label: 'positive' | 'negative' | 'neutral';
      confidence: number;
    };
    intent?: string;
    suggested_responses?: string[];
    quality_score?: number;
  };
}

/**
 * Extended profile type with organization and ticket relations
 */
export interface ProfileWithRelations extends DbProfile {
  organization?: DbOrganization;
  tickets?: DbTicket[];
  assigned_tickets?: DbTicket[];
}

/**
 * Extended organization type with member and resource relations
 */
export interface OrganizationWithRelations extends DbOrganization {
  profiles?: DbProfile[];
  tickets?: DbTicket[];
  ai_agents?: DbAiAgent[];
}

/**
 * Type Guards
 * Functions to check if an object matches a specific type
 */

/**
 * Checks if a value is a valid ticket status
 */
export const isTicketStatus = (status: any): status is TicketStatus => {
  return ['open', 'in_progress', 'pending', 'resolved', 'closed'].includes(status);
};

/**
 * Checks if a value is a valid ticket priority
 */
export const isTicketPriority = (priority: any): priority is TicketPriority => {
  return ['low', 'medium', 'high', 'urgent'].includes(priority);
};

/**
 * Checks if a value is a valid user role
 */
export const isUserRole = (role: any): role is UserRole => {
  return ['head_admin', 'admin', 'agent', 'customer'].includes(role);
};

/**
 * Checks if a value is a valid invitation type
 */
export const isInvitationType = (type: any): type is InvitationType => {
  return ['team', 'customer'].includes(type);
};

/**
 * Checks if a value is a valid invitation status
 */
export const isInvitationStatus = (status: any): status is InvitationStatus => {
  return ['pending', 'accepted', 'expired'].includes(status);
};

/**
 * Checks if an object is a valid ticket
 */
export const isTicket = (obj: any): obj is DbTicket => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'customer_id' in obj &&
    'organization_id' in obj
  );
};

/**
 * Checks if an object is a ticket with loaded relations
 */
export const isTicketWithRelations = (obj: any): obj is TicketWithRelations => {
  return (
    isTicket(obj) &&
    'customer' in obj &&
    (obj.customer === null || typeof obj.customer === 'object') &&
    (!('assigned_agent' in obj) || obj.assigned_agent === null || typeof obj.assigned_agent === 'object') &&
    (!('messages' in obj) || Array.isArray(obj.messages))
  );
};

/**
 * Checks if an object is a valid profile
 */
export const isProfile = (obj: any): obj is DbProfile => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'role' in obj &&
    isUserRole(obj.role)
  );
};

/**
 * Checks if an object is a valid organization
 */
export const isOrganization = (obj: any): obj is DbOrganization => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'slug' in obj
  );
};

// Type Safety Improvements

/**
 * Ensures a value is not null or undefined
 */
export function assertNonNullable<T>(value: T, message?: string): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message ?? 'Value must not be null or undefined');
  }
}

/**
 * Type guard to check if a value is not null or undefined
 */
export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

/**
 * Type guard for discriminated union based on status
 */
export function isTicketWithStatus<S extends TicketStatus>(
  ticket: DbTicket,
  status: S
): ticket is DbTicket & { status: S } {
  return ticket.status === status;
}

/**
 * Type guard for discriminated union based on priority
 */
export function isTicketWithPriority<P extends TicketPriority>(
  ticket: DbTicket,
  priority: P
): ticket is DbTicket & { priority: P } {
  return ticket.priority === priority;
}

/**
 * Type guard for discriminated union based on role
 */
export function isProfileWithRole<R extends UserRole>(
  profile: DbProfile,
  role: R
): profile is DbProfile & { role: R } {
  return profile.role === role;
} 