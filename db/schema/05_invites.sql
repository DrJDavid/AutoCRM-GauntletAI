/*
 * Invitation System
 * ================
 * This file contains tables related to the organization's invitation system.
 * Currently supports two types of invites:
 * 1. Agent invites (admin-only creation)
 * 2. Customer invites (admin/agent creation)
 * 
 * Key Features:
 * - Token-based invite verification
 * - Boolean acceptance tracking
 * - Email-based verification
 * - Organization-scoped invites
 */

-- Agent Organization Invites Table
-- ==============================
-- Tracks invites for new agents (admin-only creation)
CREATE TABLE public.agent_organization_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations NOT NULL,
    email TEXT NOT NULL,
    token UUID DEFAULT gen_random_uuid() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted BOOLEAN DEFAULT false,
    UNIQUE(organization_id, email)
);

COMMENT ON TABLE public.agent_organization_invites IS 'Tracks invites for new agents (admin-only invites)';

-- Customer Organization Invites Table
-- ================================
-- Tracks invites for new customers (admin/agent creation)
CREATE TABLE public.customer_organization_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations NOT NULL,
    email TEXT NOT NULL,
    token UUID DEFAULT gen_random_uuid() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted BOOLEAN DEFAULT false,
    UNIQUE(organization_id, email)
);

COMMENT ON TABLE public.customer_organization_invites IS 'Tracks invites for new customers (admin/agent invites)';

-- Indexes
-- =======
CREATE INDEX idx_agent_invites_org ON agent_organization_invites(organization_id);
CREATE INDEX idx_agent_invites_email ON agent_organization_invites(email);
CREATE INDEX idx_agent_invites_expires ON agent_organization_invites(expires_at);
CREATE INDEX idx_customer_invites_org ON customer_organization_invites(organization_id);
CREATE INDEX idx_customer_invites_email ON customer_organization_invites(email);
CREATE INDEX idx_customer_invites_expires ON customer_organization_invites(expires_at);

-- Performance Indexes for List Queries
-- =================================
-- These indexes optimize the common query patterns for listing invites:
-- 1. Filtering by organization (RLS)
-- 2. Filtering by acceptance status
-- 3. Sorting by creation date
CREATE INDEX idx_agent_invites_org_status ON agent_organization_invites(organization_id, accepted, created_at DESC);
CREATE INDEX idx_customer_invites_org_status ON customer_organization_invites(organization_id, accepted, created_at DESC);

-- Row Level Security
-- =================

-- Agent Invites RLS
ALTER TABLE public.agent_organization_invites ENABLE ROW LEVEL SECURITY;

-- Agent invites viewable by organization admins and invitee
CREATE POLICY "Agent invites viewable by organization admins" 
    ON agent_organization_invites FOR SELECT 
    USING (
        (auth.uid() IN (
            SELECT profiles.id FROM profiles 
            WHERE profiles.organization_id = agent_organization_invites.organization_id 
            AND profiles.role = 'admin'
        )) OR (email = auth.email())
    );

-- Agent invites creatable by admins only
CREATE POLICY "Agent invites creatable by organization admins" 
    ON agent_organization_invites FOR INSERT 
    WITH CHECK (
        auth.uid() IN (
            SELECT profiles.id FROM profiles 
            WHERE profiles.organization_id = profiles.organization_id 
            AND profiles.role = 'admin'
        )
    );

-- Allow users to read their own unaccepted invites
CREATE POLICY "Allow reading own unaccepted invites" 
    ON agent_organization_invites FOR SELECT 
    USING (
        email = auth.email() OR 
        lower(email) = lower(COALESCE((current_setting('request.jwt.claims'::text, true))::json->>'email', '')) OR 
        auth.role() = 'service_role'
    );

-- Allow users to accept their own invites
CREATE POLICY "Allow accepting own invites" 
    ON agent_organization_invites FOR UPDATE 
    USING (
        email = auth.email() OR 
        lower(email) = lower(COALESCE((current_setting('request.jwt.claims'::text, true))::json->>'email', '')) OR 
        auth.role() = 'service_role'
    );

-- Customer Invites RLS
ALTER TABLE public.customer_organization_invites ENABLE ROW LEVEL SECURITY;

-- Customer invites viewable by organization members and invitee
CREATE POLICY "Invites viewable by organization members and invitee" 
    ON customer_organization_invites FOR SELECT 
    USING (
        (auth.uid() IN (
            SELECT profiles.id FROM profiles 
            WHERE profiles.organization_id = customer_organization_invites.organization_id
        )) OR (email = auth.email())
    );

-- Customer invites creatable by admins and agents
CREATE POLICY "Invites creatable by organization members" 
    ON customer_organization_invites FOR INSERT 
    WITH CHECK (
        auth.uid() IN (
            SELECT profiles.id FROM profiles 
            WHERE profiles.organization_id = profiles.organization_id 
            AND profiles.role IN ('admin', 'agent')
        )
    );

-- Customer invites updatable by admins and agents
CREATE POLICY "Invites updatable by organization members" 
    ON customer_organization_invites FOR UPDATE 
    USING (
        auth.uid() IN (
            SELECT profiles.id FROM profiles 
            WHERE profiles.organization_id = profiles.organization_id 
            AND profiles.role IN ('admin', 'agent')
        )
    );

/*
 * Usage Examples
 * =============
 * 
 * 1. Create an agent invite (admin only):
 *    INSERT INTO agent_organization_invites (
 *        organization_id,
 *        email,
 *        expires_at
 *    ) VALUES (
 *        'org-uuid',
 *        'newagent@example.com',
 *        timezone('utc'::text, now() + interval '7 days')
 *    );
 * 
 * 2. Create a customer invite (admin or agent):
 *    INSERT INTO customer_organization_invites (
 *        organization_id,
 *        email,
 *        expires_at
 *    ) VALUES (
 *        'org-uuid',
 *        'customer@example.com',
 *        timezone('utc'::text, now() + interval '7 days')
 *    );
 * 
 * 3. Check for valid invite:
 *    SELECT * FROM agent_organization_invites
 *    WHERE email = 'user@example.com'
 *    AND organization_id = 'org-uuid'
 *    AND expires_at > now()
 *    AND accepted = false;
 * 
 * 4. Accept an invite:
 *    UPDATE agent_organization_invites
 *    SET accepted = true
 *    WHERE token = 'invite-token'
 *    AND expires_at > now()
 *    AND accepted = false;
 * 
 * 5. Query expired invites:
 *    SELECT * FROM agent_organization_invites
 *    WHERE expires_at < now()
 *    AND accepted = false;
 */

-- Note: Email Verification
-- =======================
-- Currently, email verification is simplified for development purposes.
-- In production, consider:
-- 1. Implementing proper email verification using the token field
-- 2. Adding rate limiting for invite creation
-- 3. Adding invite token expiration separate from invite expiration
-- 4. Implementing email notification system
