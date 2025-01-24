-- Migration: Organization Isolation and RLS
-- Description: Sets up proper RLS policies for multi-tenant isolation
-- Date: 2024-01-23

-- Enable RLS on core tables if not already enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Organization RLS
DROP POLICY IF EXISTS "Enable read access for users in organization" ON organizations;
CREATE POLICY "Enable read access for users in organization" ON organizations
    FOR SELECT
    USING (
        id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Profile RLS
DROP POLICY IF EXISTS "Allow profile access within organization" ON profiles;
CREATE POLICY "Allow profile access within organization" ON profiles
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Ticket RLS
DROP POLICY IF EXISTS "Agents see org tickets" ON tickets;
CREATE POLICY "Agents see org tickets" ON tickets
    FOR ALL
    USING (
        organization_id = (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Clean up duplicate/empty organizations
DELETE FROM organizations 
WHERE slug = 'gauntlet-ai' 
AND (SELECT COUNT(*) FROM profiles WHERE organization_id = organizations.id) = 0;

-- Add comments for documentation
COMMENT ON TABLE organizations IS 'Organizations table - core of multi-tenant system';
COMMENT ON TABLE profiles IS 'User profiles with organization association';
COMMENT ON TABLE tickets IS 'Support tickets scoped to organizations';

-- Document RLS policies
COMMENT ON POLICY "Enable read access for users in organization" ON organizations IS 'Users can only see their own organization';
COMMENT ON POLICY "Allow profile access within organization" ON profiles IS 'Users can only see profiles within their organization';
COMMENT ON POLICY "Agents see org tickets" ON tickets IS 'Agents can only see tickets from their organization';
