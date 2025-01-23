/*
 * Core Tables
 * ===========
 * This file contains the foundational tables for the multi-tenant CRM system.
 * The organization table is the root entity, and profiles extend Supabase auth.
 */

-- Organizations Table
-- ==================
-- The root entity for multi-tenant system. Each organization is completely
-- isolated from others through Row Level Security policies.
CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,  -- URL-friendly identifier
    settings JSONB DEFAULT '{}'::jsonb  -- Flexible settings storage
);

COMMENT ON TABLE public.organizations IS 'Root table for multi-tenant organizations';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN organizations.settings IS 'Flexible JSON storage for org settings';

-- Example settings structure:
/*
{
    "allowCustomerInvites": true,
    "maxTeamSize": 10,
    "features": {
        "knowledgeBase": true,
        "teamChat": false
    }
}
*/

-- Profiles Table
-- =============
-- Extends Supabase auth.users with additional profile information
-- Links users to organizations and defines their role
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'agent', 'customer')),
    organization_id UUID REFERENCES public.organizations,
    full_name TEXT,
    avatar_url TEXT
);

COMMENT ON TABLE public.profiles IS 'Extended user profiles linked to Supabase Auth';
COMMENT ON COLUMN profiles.role IS 'User role: admin, agent, or customer';

-- Organization Members Table
-- ========================
-- Junction table for managing organization membership
-- Provides additional role management within organizations
CREATE TABLE public.organization_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    organization_id UUID REFERENCES organizations NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'agent', 'customer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, organization_id)
);

COMMENT ON TABLE public.organization_members IS 'Manages organization membership and roles';

-- Indexes
-- =======
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);

-- Row Level Security
-- =================

-- Organizations RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Organizations viewable by members
CREATE POLICY "Organizations are viewable by organization members" 
    ON organizations FOR SELECT 
    USING (auth.uid() IN (
        SELECT profiles.id FROM profiles 
        WHERE profiles.organization_id = organizations.id
    ));

-- Organizations editable by admins
CREATE POLICY "Organizations are editable by admins" 
    ON organizations FOR ALL 
    USING (auth.uid() IN (
        SELECT profiles.id FROM profiles 
        WHERE profiles.organization_id = organizations.id 
        AND profiles.role = 'admin'
    ));

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view profiles in their organization
CREATE POLICY "Users can view profiles in their organization" 
    ON profiles FOR SELECT 
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Users can edit their own profile
CREATE POLICY "Users can update their own profile" 
    ON profiles FOR UPDATE 
    USING (id = auth.uid());

-- Organization Members RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Members viewable by organization members
CREATE POLICY "Members viewable by organization members" 
    ON organization_members FOR SELECT 
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Only admins can manage members
CREATE POLICY "Only admins can manage members" 
    ON organization_members FOR ALL 
    USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE organization_id = organization_members.organization_id 
            AND role = 'admin'
        )
    );

/*
 * Usage Examples
 * =============
 * 
 * 1. Create a new organization:
 *    INSERT INTO organizations (name, slug) 
 *    VALUES ('Acme Corp', 'acme-corp');
 * 
 * 2. Add a user profile:
 *    INSERT INTO profiles (id, email, role, organization_id) 
 *    VALUES ('user-uuid', 'user@example.com', 'admin', 'org-uuid');
 * 
 * 3. Query users in an organization:
 *    SELECT p.* 
 *    FROM profiles p
 *    WHERE p.organization_id = 'org-uuid'
 *    ORDER BY p.created_at;
 */
