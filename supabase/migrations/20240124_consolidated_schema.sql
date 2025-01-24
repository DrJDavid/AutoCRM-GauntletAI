-- Consolidated schema for AutoCRM
-- This migration represents the current state of the database as of 2024-01-24

-- Enums
CREATE TYPE ticket_category AS ENUM ('account', 'billing', 'technical_issue', 'other');
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'customer');

-- Base Tables
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    business_hours JSONB,
    chat_settings JSONB,
    contact_emails JSONB,
    phone_numbers JSONB,
    physical_addresses JSONB,
    settings JSONB,
    support_channels JSONB
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    organization_id UUID REFERENCES organizations(id),
    role TEXT NOT NULL CHECK (role IN ('admin', 'agent', 'customer')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams and Members
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
    team_id UUID REFERENCES teams(id),
    profile_id UUID REFERENCES profiles(id),
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (team_id, profile_id)
);

-- Tickets and Related Tables
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category ticket_category NOT NULL,
    customer_id UUID NOT NULL REFERENCES profiles(id),
    assigned_agent_id UUID REFERENCES profiles(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    metadata JSONB,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    author_id UUID NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    author_id UUID NOT NULL REFERENCES profiles(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    parent_comment_id UUID REFERENCES ticket_comments(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id),
    comment_id UUID REFERENCES ticket_comments(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (ticket_id IS NOT NULL OR comment_id IS NOT NULL)
);

-- Invite System
CREATE TABLE IF NOT EXISTS agent_organization_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_organization_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES profiles(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Base
CREATE TABLE IF NOT EXISTS knowledge_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES profiles(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debug Logging
CREATE TABLE IF NOT EXISTS debug_logs (
    id SERIAL PRIMARY KEY,
    event_type TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_agent ON tickets(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_organization ON tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_author ON ticket_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_attachments_comment ON attachments(comment_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_profile ON team_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_org ON knowledge_articles(organization_id);

-- Views
CREATE OR REPLACE VIEW agent_performance AS
SELECT 
    t.assigned_agent_id,
    p.full_name as agent_name,
    t.organization_id,
    COUNT(*) as total_tickets,
    COUNT(*) FILTER (WHERE t.status = 'resolved') as resolved_tickets,
    AVG(EXTRACT(EPOCH FROM (
        CASE 
            WHEN t.status = 'resolved' 
            THEN t.updated_at - t.created_at
            ELSE NULL 
        END
    ))/3600)::numeric as avg_resolution_time
FROM tickets t
LEFT JOIN profiles p ON t.assigned_agent_id = p.id
GROUP BY t.assigned_agent_id, p.full_name, t.organization_id;

CREATE OR REPLACE VIEW team_performance AS
SELECT 
    t.id as team_id,
    t.name as team_name,
    COUNT(DISTINCT tm.profile_id) as team_size,
    COUNT(DISTINCT tk.id) as total_tickets,
    COUNT(DISTINCT CASE WHEN tk.status = 'resolved' THEN tk.id END) as resolved_tickets
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
LEFT JOIN tickets tk ON tk.assigned_agent_id IN (
    SELECT profile_id FROM team_members WHERE team_id = t.id
)
GROUP BY t.id, t.name;

CREATE OR REPLACE VIEW ticket_stats AS
SELECT 
    organization_id,
    status,
    priority,
    COUNT(*) as ticket_count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600)::numeric as avg_resolution_time
FROM tickets
GROUP BY organization_id, status, priority;
