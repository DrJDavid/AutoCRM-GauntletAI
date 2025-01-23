export type Role = 'admin' | 'agent' | 'customer';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Organization {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  settings: {
    allowCustomerInvites?: boolean;
    maxTeamSize?: number;
    features?: {
      knowledgeBase?: boolean;
      teamChat?: boolean;
    };
    [key: string]: any;
  };
}

export interface Profile {
  id: string;
  created_at: string;
  email: string;
  role: Role;
  organization_id: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Team {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface TeamMember {
  team_id: string;
  profile_id: string;
  role: 'member' | 'lead';
  created_at: string;
}

export interface Ticket {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  customer_id: string;
  assigned_agent_id?: string;
  organization_id: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface KnowledgeArticle {
  id: string;
  organization_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_id?: string;
  status: 'draft' | 'published' | 'archived';
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface AgentPerformance {
  assigned_agent_id?: string;
  agent_name?: string;
  total_tickets: number;
  resolved_tickets: number;
  avg_resolution_time?: number;
  organization_id?: string;
}

export interface TeamPerformance {
  team_id?: string;
  team_name?: string;
  team_size: number;
  total_tickets: number;
  resolved_tickets: number;
}

export interface AgentOrganizationInvite {
  id: string;
  organization_id: string;
  email: string;
  token: string;
  created_at: string;
  expires_at: string;
  accepted: boolean;
}

export interface CustomerOrganizationInvite {
  id: string;
  organization_id: string;
  email: string;
  token: string;
  created_at: string;
  expires_at: string;
  accepted: boolean;
}

// Database schema type
export interface Database {
  public: {
    Tables: {
      organizations: Organization;
      profiles: Profile;
      teams: Team;
      team_members: TeamMember;
      tickets: Ticket;
      knowledge_articles: KnowledgeArticle;
      agent_organization_invites: AgentOrganizationInvite;
      customer_organization_invites: CustomerOrganizationInvite;
    };
    Views: {
      agent_performance: AgentPerformance;
      team_performance: TeamPerformance;
    };
    Functions: {
      check_agent_invite: (org_id: string, email_address: string) => boolean;
      check_customer_invite: (org_id: string, email_address: string) => boolean;
      accept_invite: (invite_type: 'agent' | 'customer', invite_id: string) => boolean;
    };
  };
}
