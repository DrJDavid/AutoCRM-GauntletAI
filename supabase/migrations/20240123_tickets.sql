-- Ensure RLS is enabled
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Customers can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Organization members can view tickets in their org" ON tickets;
DROP POLICY IF EXISTS "Customers can create tickets" ON tickets;

-- Policy for customers viewing their own tickets
CREATE POLICY "Customers can view their own tickets" ON tickets
    FOR SELECT
    USING (auth.uid() = customer_id);

-- Policy for organization members viewing tickets in their organization
CREATE POLICY "Organization members can view tickets in their org" ON tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND organization_id = tickets.organization_id
            AND organization_id IS NOT NULL
        )
    );

-- Policy for customers creating tickets
CREATE POLICY "Customers can create tickets" ON tickets
    FOR INSERT
    WITH CHECK (
        auth.uid() = customer_id
    );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS tickets_customer_id_idx ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS tickets_organization_id_idx ON tickets(organization_id);
