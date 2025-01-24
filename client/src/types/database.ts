/**
 * Database Types
 * This file contains TypeScript types generated from our Supabase database schema.
 * These types ensure type safety when interacting with the database through Supabase client.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ==================== Organization Types ====================

/**
 * Organization entity with all its settings and contact information
 */
export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
  business_hours: Json | null
  chat_settings: Json | null
  contact_emails: Json | null
  phone_numbers: Json | null
  physical_addresses: Json | null
  settings: Json | null
  support_channels: Json | null
}

/**
 * Member of an organization with their role
 */
export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: string
  created_at: string | null
  updated_at: string | null
}

// ==================== User & Profile Types ====================

/**
 * User profile with role and organization affiliation
 */
export interface Profile {
  id: string
  email: string
  role: 'admin' | 'agent' | 'customer'
  organization_id: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

// ==================== Team Types ====================

/**
 * Team within an organization
 */
export interface Team {
  id: string
  name: string
  description: string | null
  organization_id: string
  metadata: Json | null
  created_at: string
}

/**
 * Team member with their role
 */
export interface TeamMember {
  team_id: string
  profile_id: string
  role: string
  created_at: string
}

// ==================== Ticket Types ====================

/**
 * Ticket priority levels
 */
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

/**
 * Ticket status options
 */
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

/**
 * Ticket category options
 */
export type TicketCategory = 'technical' | 'billing' | 'account' | 'feature' | 'other'

/**
 * Support ticket with all its details
 */
export interface Ticket {
  id: string
  title: string
  description: string | null
  customer_id: string
  organization_id: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  assigned_agent_id: string | null
  created_at: string
  updated_at: string
  customer?: User
  assigned_agent?: User
  attachments?: Attachment[]
  tags: string[] | null
  metadata: Record<string, unknown> | null
}

/**
 * Message in a ticket thread
 */
export interface TicketMessage {
  id: string
  ticket_id: string
  author_id: string
  content: string
  is_internal: boolean | null
  metadata: Json | null
  created_at: string
}

/**
 * Comment on a ticket
 */
export interface TicketComment {
  id: string
  ticket_id: string
  author_id: string
  content: string
  parent_comment_id: string | null
  is_internal: boolean | null
  organization_id: string
  created_at: string | null
  updated_at: string | null
  edited_at: string | null
}

// ==================== Attachment Types ====================

/**
 * File attachment for tickets or comments
 */
export interface Attachment {
  id: string
  file_name: string
  file_size: number
  file_path: string
  content_type: string
  ticket_id: string
  comment_id: string | null
  organization_id: string
  uploaded_by: string
  created_at: string
  updated_at: string
}

// ==================== Knowledge Base Types ====================

/**
 * Knowledge base article
 */
export interface KnowledgeArticle {
  id: string
  title: string
  content: string
  author_id: string | null
  organization_id: string
  status: string
  tags: string[] | null
  metadata: Json | null
  created_at: string
  updated_at: string
}

// ==================== Analytics View Types ====================

/**
 * Agent performance metrics
 */
export interface AgentPerformance {
  agent_name: string | null
  assigned_agent_id: string | null
  organization_id: string | null
  total_tickets: number | null
  resolved_tickets: number | null
  avg_resolution_time: number | null
}

/**
 * Team performance metrics
 */
export interface TeamPerformance {
  team_id: string | null
  team_name: string | null
  team_size: number | null
  total_tickets: number | null
  resolved_tickets: number | null
}

/**
 * Ticket statistics by organization
 */
export interface TicketStats {
  organization_id: string | null
  status: string | null
  priority: string | null
  ticket_count: number | null
  avg_resolution_time: number | null
}

// ==================== Invitation Types ====================

interface BaseInvite {
  id: string
  organization_id: string
  email: string
  token: string
  accepted: boolean | null
  created_at: string
  expires_at: string
}

/**
 * Invitation for an agent to join an organization
 */
export interface AgentOrganizationInvite extends BaseInvite {}

/**
 * Invitation for a customer to join an organization
 */
export interface CustomerOrganizationInvite extends BaseInvite {}
