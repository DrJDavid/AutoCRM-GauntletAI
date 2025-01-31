-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view their own invitations" ON invitations;

-- Create an updated version that handles registration flow better
CREATE POLICY "Users can view their own invitations"
  ON invitations FOR SELECT
  TO public
  USING (
    (status = 'pending' AND type = 'customer') -- Only allow viewing pending customer invitations
    AND (
      -- Match on email if provided
      email = coalesce(
        (select email from auth.users where id = auth.uid()),
        current_setting('request.jwt.claims', true)::json->>'email',
        current_setting('app.email', true) -- This will be set during registration
      )
      OR 
      auth.role() = 'anon'  -- Allow anonymous access during registration
    )
  ); 