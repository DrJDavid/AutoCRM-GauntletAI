-- Drop all variations of the functions to avoid conflicts
DROP FUNCTION IF EXISTS accept_invitation_by_email(text);
DROP FUNCTION IF EXISTS accept_invitation_by_email(text, uuid);
DROP FUNCTION IF EXISTS validate_invite_by_email(text, invitation_type);

-- Create a new function to validate and get invitation details
CREATE OR REPLACE FUNCTION validate_and_get_invite(
  email_param text,
  type_param invitation_type
)
RETURNS TABLE (
  organization_id uuid,
  role user_role,
  is_valid boolean,
  token uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.organization_id,
    i.role,
    (i.status = 'pending' AND i.expires_at > now()) as is_valid,
    i.token
  FROM invitations i
  WHERE i.email = email_param
    AND i.type = type_param
    AND i.status = 'pending'
    AND i.expires_at > now()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new function to accept invitation with user ID
CREATE OR REPLACE FUNCTION accept_invite_with_user(
  invitee_email text,
  user_id uuid
)
RETURNS uuid AS $$
DECLARE
  invite_record invitations;
BEGIN
  -- Look up a pending invitation for the given email that has not expired
  SELECT * INTO invite_record
  FROM invitations
  WHERE email = invitee_email
    AND status = 'pending'
    AND expires_at > now()
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No valid invitation found for this email';
  END IF;

  -- Update the invitation status
  UPDATE invitations
  SET status = 'accepted',
      accepted_at = now()
  WHERE id = invite_record.id;

  -- Create or update the user profile
  INSERT INTO profiles (
    id,
    organization_id,
    role,
    email,
    is_active
  ) VALUES (
    user_id,
    invite_record.organization_id,
    invite_record.role,
    invite_record.email,
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET organization_id = EXCLUDED.organization_id,
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active;

  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION validate_and_get_invite(text, invitation_type) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION accept_invite_with_user(text, uuid) TO anon, authenticated; 