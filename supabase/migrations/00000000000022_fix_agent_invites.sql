-- Drop conflicting policies
DROP POLICY IF EXISTS "Admins can create invitations for their organization" ON invitations;
DROP POLICY IF EXISTS "Invitations creatable by organization admins" ON invitations;

-- Create new policy for agent invites
CREATE POLICY "Admins can create agent invites"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    type = 'agent' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = invitations.organization_id
      AND profiles.role IN ('head_admin', 'admin')
    )
  );

-- Create new policy for customer invites
CREATE POLICY "Admins can create customer invites"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    type = 'customer' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = invitations.organization_id
      AND profiles.role IN ('head_admin', 'admin')
    )
  ); 