-- Drop any existing token-based function with the new name (if present)
drop function if exists accept_agent_invitation(uuid);

-- Create a new function to accept an agent invitation using an invitation token.
create or replace function accept_agent_invitation(
  invitation_token uuid
)
returns uuid as $$
declare
  invite_record invitations;
  user_id uuid;
begin
  -- Get and validate the invitation record based on the token
  select * into invite_record
  from invitations
  where token = invitation_token
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Invalid or expired invitation';
  end if;

  -- Get the current authenticated user's ID
  user_id := auth.uid();
  if user_id is null then
    raise exception 'No authenticated user';
  end if;

  -- Update invitation status to accepted
  update invitations
  set status = 'accepted',
      accepted_at = now()
  where token = invitation_token;

  -- Create (or update) the profile using the invitation's organization data
  insert into profiles (
    id,
    organization_id,
    role,
    email,
    is_active
  ) values (
    user_id,
    invite_record.organization_id,
    invite_record.role,
    invite_record.email,
    true
  )
  on conflict (id) do update
  set organization_id = invite_record.organization_id,
      role = invite_record.role,
      is_active = true;

  return user_id;
end;
$$ language plpgsql security definer; 