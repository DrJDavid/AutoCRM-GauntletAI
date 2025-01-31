-- Drop any previously defined invitation acceptance functions
drop function if exists accept_agent_invitation(uuid);
drop function if exists accept_invitation(text, uuid);  -- In case an older version exists

-- Create a new unified function to accept an invitation given its token.
create or replace function accept_invitation(
  invitation_token uuid
)
returns uuid as $$
declare
  invite_record invitations;
  user_id uuid;
begin
  -- Look up the invitation by token with status pending and not expired
  select * into invite_record
  from invitations
  where token = invitation_token
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'Invalid or expired invitation';
  end if;

  -- Retrieve the current authenticated user's ID 
  user_id := auth.uid();
  if user_id is null then
    raise exception 'No authenticated user';
  end if;

  -- Update the invitation status to accepted
  update invitations
  set status = 'accepted',
      accepted_at = now()
  where token = invitation_token;

  -- Insert or update the user's profile using invitation data
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
  set organization_id = EXCLUDED.organization_id,
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active;

  return user_id;
end;
$$ language plpgsql security definer; 