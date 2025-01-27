-- migrate:up
BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Org members can access organization" ON organizations;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage team members" ON profiles;

-- Create new non-recursive policies
-- Organization policies
CREATE POLICY "Public can read organizations" ON organizations
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create organizations" ON organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organization members can update their org" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.organization_id = organizations.id 
            AND profiles.id = auth.uid()
            AND profiles.role IN ('head_admin', 'admin')
        )
    );

-- Profile policies
CREATE POLICY "Users can read all profiles in their org" ON profiles
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
        OR id = auth.uid()
    );

CREATE POLICY "Users can manage their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage org profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles admin 
            WHERE admin.id = auth.uid()
            AND admin.role IN ('head_admin', 'admin')
            AND admin.organization_id = profiles.organization_id
        )
    );

COMMIT;

-- migrate:down
BEGIN;

-- Drop new policies
DROP POLICY IF EXISTS "Public can read organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Organization members can update their org" ON organizations;
DROP POLICY IF EXISTS "Users can read all profiles in their org" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage org profiles" ON profiles;

-- Restore original policies
CREATE POLICY "Org members can access organization" ON organizations
    FOR ALL USING (
        id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
        AND is_deleted = false
    );

CREATE POLICY "Users can manage their own profile" ON profiles
    FOR ALL USING (id = auth.uid());

CREATE POLICY "Admins can manage team members" ON profiles
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
        AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('head_admin', 'admin')
        AND is_deleted = false
    );

COMMIT;
