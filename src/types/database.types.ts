export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enum Types
export type UserRole = 'head_admin' | 'admin' | 'agent' | 'customer';
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type InvitationType = 'team' | 'customer';
export type InvitationStatus = 'pending' | 'accepted' | 'expired';

// Base Tables
export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string | null;
  updated_at: string | null;
  settings: Json;
  metadata: Json;
  is_active: boolean | null;
}

export interface Profile {
  id: string;
  organization_id: string | null;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  title: string | null;
  department: string | null;
  metadata: Json;
  created_at: string | null;
  updated_at: string | null;
  last_seen_at: string | null;
  is_active: boolean | null;
  organization?: Organization;
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  type: InvitationType;
  status: InvitationStatus;
  invited_by: string;
  created_at: string;
  expires_at: string;
  metadata: Json;
}

export interface Ticket {
  id: string;
  organization_id: string;
  customer_id: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  metadata: Json;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  last_activity_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  message_id: string | null;
  uploader_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  metadata: Json;
  created_at: string;
}

export interface AIAgent {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  configuration: Json;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface AIAgentAssignment {
  id: string;
  agent_id: string;
  ticket_id: string;
  status: string;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface AIAgentResponse {
  id: string;
  assignment_id: string;
  content: string;
  confidence_score: number | null;
  metadata: Json;
  created_at: string;
}

export interface TicketWithRelations extends Ticket {
  customer?: Profile;
  assigned_agent?: Profile;
  messages?: TicketMessage[];
  attachments?: TicketAttachment[];
  ai_assignments?: Array<AIAgentAssignment & {
    ai_agent?: AIAgent;
    responses?: AIAgentResponse[];
  }>;
} 
