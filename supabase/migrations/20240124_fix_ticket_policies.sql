-- Fix ticket policies to ensure proper agent access
-- This migration updates the RLS policies for the tickets table to properly handle agent access

-- migrate:up
BEGIN;

-- Record this migration
INSERT INTO schema_version (version, description)
VALUES ('20240124_fix_ticket_policies', 'Fix ticket policies for agent access')
ON CONFLICT (version) DO NOTHING;

-- Drop existing policies
DROP POLICY IF EXISTS "Tickets viewable by organization members and owner" ON tickets;
DROP POLICY IF EXISTS "Tickets creatable by customers" ON tickets;
DROP POLICY IF EXISTS "Tickets updatable by agents and admins" ON tickets;

-- Create comprehensive policies for tickets
-- Policy for viewing tickets
CREATE POLICY "view_tickets" ON tickets
FOR SELECT USING (
    -- Customers can view their own tickets
    customer_id = auth.uid()
    OR 
    -- Agents and admins can view tickets from their organization
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id = tickets.organization_id
        AND profiles.role IN ('agent', 'admin')
    )
);

-- Policy for creating tickets
CREATE POLICY "create_tickets" ON tickets
FOR INSERT WITH CHECK (
    -- Customers can create tickets
    customer_id = auth.uid()
    OR
    -- Agents and admins can create tickets on behalf of customers in their org
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id = tickets.organization_id
        AND profiles.role IN ('agent', 'admin')
    )
);

-- Policy for updating tickets
CREATE POLICY "update_tickets" ON tickets
FOR UPDATE USING (
    -- Customers can update their own tickets
    customer_id = auth.uid()
    OR
    -- Agents and admins can update tickets from their organization
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id = tickets.organization_id
        AND profiles.role IN ('agent', 'admin')
    )
);

COMMIT;

-- migrate:down
BEGIN;
    -- Revert to original policies
    DROP POLICY IF EXISTS "view_tickets" ON tickets;
    DROP POLICY IF EXISTS "create_tickets" ON tickets;
    DROP POLICY IF EXISTS "update_tickets" ON tickets;

    -- Recreate original policies
    CREATE POLICY "Tickets viewable by organization members and owner" 
        ON tickets FOR SELECT 
        USING (
            organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
            OR customer_id = auth.uid()
        );

    CREATE POLICY "Tickets creatable by customers" 
        ON tickets FOR INSERT 
        WITH CHECK (
            customer_id = auth.uid()
        );

    CREATE POLICY "Tickets updatable by agents and admins" 
        ON tickets FOR UPDATE 
        USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND organization_id = tickets.organization_id
                AND role IN ('agent', 'admin')
            )
        );
END;
