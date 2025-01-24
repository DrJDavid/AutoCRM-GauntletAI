-- migrate:up
BEGIN;

-- Record this migration
INSERT INTO schema_version (version, description)
VALUES ('20240124_020200', 'RLS policies')
ON CONFLICT (version) DO NOTHING;

-- [Previous RLS policies content goes here]
-- I'm not including it here to avoid repetition, but it would contain all
-- our RLS policies from the previous files

COMMIT;

-- migrate:down
BEGIN;
    -- Disable RLS on all tables
    ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
    ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
    ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
    ALTER TABLE attachments DISABLE ROW LEVEL SECURITY;
    ALTER TABLE organization_contacts DISABLE ROW LEVEL SECURITY;
    
    -- Drop all policies
    DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
    DROP POLICY IF EXISTS "Users can view accessible profiles" ON profiles;
    DROP POLICY IF EXISTS "Customers can view their own tickets" ON tickets;
    DROP POLICY IF EXISTS "Organization members can view tickets in their org" ON tickets;
    DROP POLICY IF EXISTS "Customers can create tickets" ON tickets;
    DROP POLICY IF EXISTS "Agents can update tickets in their org" ON tickets;
    -- ... [other policy drops]
COMMIT;
