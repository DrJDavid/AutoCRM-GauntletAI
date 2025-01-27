-- migrate:up
BEGIN;

-- ENUMS
CREATE TYPE ticket_category AS ENUM ('account', 'billing', 'technical_issue', 'other');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE user_role AS ENUM ('head_admin', 'admin', 'agent', 'customer');

-- CORE TABLES
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    organization_id UUID REFERENCES organizations(id),
    role user_role NOT NULL,
    is_head_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    CHECK (
        (role = 'head_admin' AND is_head_admin IS true) OR 
        (role IN ('admin', 'agent', 'customer') AND is_head_admin IS false)
    )
);

-- TICKET SYSTEM
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    current_description TEXT NOT NULL,
    priority ticket_priority NOT NULL DEFAULT 'medium',
    category ticket_category NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    customer_id UUID NOT NULL REFERENCES profiles(id),
    assigned_agent_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false
);

-- TICKET VERSION HISTORY
CREATE TABLE ticket_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    description TEXT NOT NULL,
    updated_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TICKET MESSAGES
CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    author_id UUID NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false
);

-- FILE ATTACHMENTS
CREATE TABLE ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id),
    message_id UUID REFERENCES ticket_messages(id),
    file_path TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    CHECK (ticket_id IS NOT NULL OR message_id IS NOT NULL)
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX idx_tickets_organization_id ON tickets(organization_id);
CREATE INDEX idx_tickets_assigned_agent_id ON tickets(assigned_agent_id);
CREATE INDEX idx_ticket_attachments_ticket ON ticket_attachments(ticket_id);
CREATE INDEX idx_ticket_versions_ticket ON ticket_versions(ticket_id);

-- UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ORG CREATION FUNCTION
CREATE OR REPLACE FUNCTION create_organization_with_admin(
    org_name TEXT,
    org_slug TEXT,
    admin_email TEXT,
    admin_password TEXT
) RETURNS UUID AS $$
DECLARE
    new_org_id UUID;
    new_user_id UUID;
BEGIN
    INSERT INTO organizations (name, slug)
    VALUES (org_name, org_slug)
    RETURNING id INTO new_org_id;

    new_user_id := auth.create_user(
        email := admin_email,
        password := admin_password
    );

    INSERT INTO profiles (id, email, organization_id, role, is_head_admin)
    VALUES (new_user_id, admin_email, new_org_id, 'head_admin', true);

    RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ADMIN TRANSFER FUNCTION (WITH SECURITY CHECKS)
CREATE OR REPLACE FUNCTION transfer_head_admin(
    current_head_admin_id UUID,
    new_admin_id UUID
) RETURNS void AS $$
BEGIN
    PERFORM 1 FROM profiles 
    WHERE id = current_head_admin_id 
    AND is_head_admin = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Only head admins can transfer privileges';
    END IF;

    UPDATE profiles 
    SET is_head_admin = false 
    WHERE id = current_head_admin_id;

    UPDATE profiles 
    SET role = 'head_admin', is_head_admin = true 
    WHERE id = new_admin_id 
    AND organization_id = (
        SELECT organization_id 
        FROM profiles 
        WHERE id = current_head_admin_id
    )
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = new_admin_id
        AND organization_id = (SELECT organization_id FROM profiles WHERE id = current_head_admin_id)
    );

    IF NOT FOUND THEN
        RAISE EXCEPTION 'New admin must belong to the same organization';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ROW LEVEL SECURITY
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- ORG POLICIES
CREATE POLICY "Org members can access organization" ON organizations
FOR ALL USING (
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND is_deleted = false
);

-- PROFILE POLICIES
CREATE POLICY "Users can manage their own profile" ON profiles
FOR ALL USING (id = auth.uid());

CREATE POLICY "Admins can manage team members" ON profiles
FOR ALL USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('head_admin', 'admin')
    AND is_deleted = false
);

-- TICKET POLICIES
CREATE POLICY "Customers can manage their tickets" ON tickets
FOR ALL USING (
    customer_id = auth.uid()
    AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND is_deleted = false
);

CREATE POLICY "Agents can access org tickets" ON tickets
FOR ALL USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('head_admin', 'admin', 'agent')
    AND is_deleted = false
);

-- ATTACHMENT POLICIES
CREATE POLICY "Access own ticket attachments" ON ticket_attachments
FOR ALL USING (
    (ticket_id IN (SELECT id FROM tickets WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())))
    OR (message_id IN (SELECT id FROM ticket_messages WHERE ticket_id IN (SELECT id FROM tickets WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()))))
)
WITH CHECK (
    uploaded_by = auth.uid()
);

COMMIT;

-- migrate:down
BEGIN;

-- Drop policies
DROP POLICY IF EXISTS "Access own ticket attachments" ON ticket_attachments;
DROP POLICY IF EXISTS "Agents can access org tickets" ON tickets;
DROP POLICY IF EXISTS "Customers can manage their tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can manage team members" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Org members can access organization" ON organizations;

-- Drop triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;

-- Drop functions
DROP FUNCTION IF EXISTS transfer_head_admin;
DROP FUNCTION IF EXISTS create_organization_with_admin;
DROP FUNCTION IF EXISTS update_updated_at_column;

-- Drop tables
DROP TABLE IF EXISTS ticket_attachments;
DROP TABLE IF EXISTS ticket_versions;
DROP TABLE IF EXISTS ticket_messages;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS organizations;

-- Drop indexes
DROP INDEX IF EXISTS idx_profiles_organization_id;
DROP INDEX IF EXISTS idx_tickets_organization_id;
DROP INDEX IF EXISTS idx_tickets_assigned_agent_id;
DROP INDEX IF EXISTS idx_ticket_attachments_ticket;
DROP INDEX IF EXISTS idx_ticket_versions_ticket;

-- Drop enums
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS ticket_priority;
DROP TYPE IF EXISTS ticket_category;

COMMIT;