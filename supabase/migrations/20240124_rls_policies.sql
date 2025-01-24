-- Row Level Security Policies for AutoCRM
-- This migration consolidates all RLS policies for our tables

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_contacts ENABLE ROW LEVEL SECURITY;

-- Organizations Policies
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT
    USING (
        id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Profiles Policies
CREATE POLICY "Users can view accessible profiles" ON profiles
    FOR SELECT USING (
        -- Users can view their own profile
        auth.uid() = id
        OR
        -- Users can view profiles in their organization
        (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        ) = organization_id
        OR
        -- Customers can view profiles related to their tickets
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.customer_id = auth.uid()
            AND (
                t.assigned_agent_id = profiles.id
                OR
                EXISTS (
                    SELECT 1 FROM messages m
                    WHERE m.ticket_id = t.id
                    AND m.user_id = profiles.id
                )
            )
        )
    );

-- Tickets Policies
CREATE POLICY "Customers can view their own tickets" ON tickets
    FOR SELECT
    USING (auth.uid() = customer_id);

CREATE POLICY "Organization members can view tickets in their org" ON tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND organization_id = tickets.organization_id
            AND role IN ('admin', 'agent')
        )
    );

CREATE POLICY "Customers can create tickets" ON tickets
    FOR INSERT
    WITH CHECK (
        auth.uid() = customer_id
        AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND organization_id = tickets.organization_id
        )
    );

CREATE POLICY "Agents can update tickets in their org" ON tickets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND organization_id = tickets.organization_id
            AND role IN ('admin', 'agent')
        )
    );

-- Messages Policies
CREATE POLICY "Users can view messages on accessible tickets" ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_id
            AND (
                t.customer_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid()
                    AND organization_id = t.organization_id
                    AND role IN ('admin', 'agent')
                )
            )
        )
    );

CREATE POLICY "Users can create messages on accessible tickets" ON messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_id
            AND (
                t.customer_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid()
                    AND organization_id = t.organization_id
                    AND role IN ('admin', 'agent')
                )
            )
        )
    );

-- Attachments Policies
CREATE POLICY "Users can view attachments on accessible tickets" ON attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_id
            AND (
                t.customer_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid()
                    AND organization_id = t.organization_id
                    AND role IN ('admin', 'agent')
                )
            )
        )
    );

CREATE POLICY "Users can upload attachments to accessible tickets" ON attachments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_id
            AND (
                t.customer_id = auth.uid()
                OR
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid()
                    AND organization_id = t.organization_id
                    AND role IN ('admin', 'agent')
                )
            )
        )
        AND uploaded_by = auth.uid()
    );

-- Organization Contacts Policies
CREATE POLICY "Organization members can view contacts" ON organization_contacts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND organization_id = organization_contacts.organization_id
        )
    );

CREATE POLICY "Admins can manage contacts" ON organization_contacts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND organization_id = organization_contacts.organization_id
            AND role = 'admin'
        )
    );
