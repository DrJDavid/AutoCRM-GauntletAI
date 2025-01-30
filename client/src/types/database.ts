/**
 * Database Types
 * This file contains TypeScript types generated from our Supabase database schema.
 * These types ensure type safety when interacting with the database through Supabase client.
 */

import { User } from "@supabase/supabase-js"
import type { Database } from './supabase';

// Re-export the Json type
export type { Json } from './supabase';

// Enum Types
export type UserRole = Database['public']['Enums']['user_role'];
export type TicketStatus = Database['public']['Enums']['ticket_status'];
export type TicketPriority = Database['public']['Enums']['ticket_priority'];
export type TicketCategory = 'account' | 'billing' | 'technical_issue' | 'other';
export type InvitationType = Database['public']['Enums']['invitation_type'];
export type InvitationStatus = Database['public']['Enums']['invitation_status'];

// Table Types
export type DbOrganization = Database['public']['Tables']['organizations']['Row'];
export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbTicket = Database['public']['Tables']['tickets']['Row'];
export type DbTicketMessage = Database['public']['Tables']['ticket_messages']['Row'];
export type DbTicketAttachment = Database['public']['Tables']['ticket_attachments']['Row'];
export type DbAiAgent = Database['public']['Tables']['ai_agents']['Row'];
export type DbAiAgentAssignment = Database['public']['Tables']['ai_agent_assignments']['Row'];
export type DbAiAgentResponse = Database['public']['Tables']['ai_agent_responses']['Row'];
export type DbInvitation = Database['public']['Tables']['invitations']['Row'];

// Insert Types
export type DbOrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
export type DbProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type DbTicketInsert = Database['public']['Tables']['tickets']['Insert'];
export type DbTicketMessageInsert = Database['public']['Tables']['ticket_messages']['Insert'];
export type DbTicketAttachmentInsert = Database['public']['Tables']['ticket_attachments']['Insert'];
export type DbAiAgentInsert = Database['public']['Tables']['ai_agents']['Insert'];
export type DbAiAgentAssignmentInsert = Database['public']['Tables']['ai_agent_assignments']['Insert'];
export type DbAiAgentResponseInsert = Database['public']['Tables']['ai_agent_responses']['Insert'];
export type DbInvitationInsert = Database['public']['Tables']['invitations']['Insert'];

// Update Types
export type DbOrganizationUpdate = Database['public']['Tables']['organizations']['Update'];
export type DbProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type DbTicketUpdate = Database['public']['Tables']['tickets']['Update'];
export type DbTicketMessageUpdate = Database['public']['Tables']['ticket_messages']['Update'];
export type DbTicketAttachmentUpdate = Database['public']['Tables']['ticket_attachments']['Update'];
export type DbAiAgentUpdate = Database['public']['Tables']['ai_agents']['Update'];
export type DbAiAgentAssignmentUpdate = Database['public']['Tables']['ai_agent_assignments']['Update'];
export type DbAiAgentResponseUpdate = Database['public']['Tables']['ai_agent_responses']['Update'];
export type DbInvitationUpdate = Database['public']['Tables']['invitations']['Update'];

// Extended Types with Relations
export interface TicketWithRelations extends DbTicket {
  customer?: DbProfile;
  assigned_agent?: DbProfile;
  messages?: DbTicketMessage[];
  attachments?: DbTicketAttachment[];
}

export interface TicketMessageWithRelations extends DbTicketMessage {
  sender?: DbProfile;
  attachments?: DbTicketAttachment[];
}

export interface ProfileWithRelations extends DbProfile {
  organization?: DbOrganization;
  tickets?: DbTicket[];
  assigned_tickets?: DbTicket[];
}

export interface OrganizationWithRelations extends DbOrganization {
  profiles?: DbProfile[];
  tickets?: DbTicket[];
  ai_agents?: DbAiAgent[];
}

// Function Return Types
export type GetUserRole = Database['public']['Functions']['get_user_role']['Returns'];
export type GetUserOrganizationId = Database['public']['Functions']['get_user_organization_id']['Returns'];
export type GetTicketStats = Database['public']['Functions']['get_ticket_stats']['Returns'];
export type GetAgentPerformance = Database['public']['Functions']['get_agent_performance']['Returns'];
export type ValidateInviteByEmail = Database['public']['Functions']['validate_invite_by_email']['Returns'];

// Extended types with relationships
export type Ticket = DbTicket & {
  customer?: DbProfile;
  assigned_agent?: DbProfile;
};

export type Profile = DbProfile & {
  organization?: DbOrganization;
};

export type Organization = DbOrganization & {
  members?: DbProfile[];
};

// Type guards
export const isTicketStatus = (status: any): status is TicketStatus => {
  return ['open', 'in_progress', 'pending', 'resolved', 'closed'].includes(status);
};

export const isTicketPriority = (priority: any): priority is TicketPriority => {
  return ['low', 'medium', 'high', 'urgent'].includes(priority);
}; 