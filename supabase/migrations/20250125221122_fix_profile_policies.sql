-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage team members" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Allow users to create their initial profile"
ON profiles FOR INSERT
TO authenticated, anon
WITH CHECK (
  -- Allow creation if no profile exists for this user yet
  NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view profiles in their organization"
ON profiles FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
    AND is_deleted = false
  )
  AND is_deleted = false
);

CREATE POLICY "Admins can manage team member profiles"
ON profiles FOR ALL
TO authenticated
USING (
  -- Check if the current user is an admin/head_admin in the same org as the target profile
  EXISTS (
    SELECT 1 FROM profiles admin
    WHERE admin.id = auth.uid()
    AND admin.role IN ('admin', 'head_admin')
    AND admin.organization_id = profiles.organization_id
    AND admin.is_deleted = false
  )
  AND is_deleted = false
)
WITH CHECK (
  -- Check if the current user is an admin/head_admin in the same org
  EXISTS (
    SELECT 1 FROM profiles admin
    WHERE admin.id = auth.uid()
    AND admin.role IN ('admin', 'head_admin')
    AND admin.organization_id = organization_id
    AND admin.is_deleted = false
  )
  -- Prevent admins from modifying other admins/head_admins
  AND (
    role NOT IN ('admin', 'head_admin')
    OR auth.uid() IN (
      SELECT id FROM profiles
      WHERE role = 'head_admin'
      AND is_deleted = false
    )
  )
);

-- Add comment explaining the policies
COMMENT ON TABLE profiles IS 'User profiles with role-based access control through RLS policies:
- New users can create their initial profile
- Users can view and update their own profile
- Users can view other profiles in their organization
- Admins can manage team member profiles except other admins
- Head admins can manage all profiles';
