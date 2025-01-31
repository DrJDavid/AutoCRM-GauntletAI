-- Drop any existing invitation acceptance function by email if needed
drop function if exists accept_invitation_by_email(text);

-- Create a function to accept an invitation based on email address.
create or replace function accept_invitation_by_email(
  invitee_email text
)
returns uuid as $$
declare
  invite_record invitations;
  user_id uuid;
begin
  -- Look up a pending invitation for the given email that has not expired.
  select * into invite_record
  from invitations
  where lower(email) = lower(invitee_email)
    and status = 'pending'
    and expires_at > now()
  order by created_at asc  -- in case there are multiple, choose the oldest one
  limit 1
  for update;

  if not found then
    raise exception 'No valid invitation found for this email';
  end if;

  -- Retrieve the authenticated user's ID. (User must already be signed in.)
  user_id := auth.uid();
  if user_id is null then
    raise exception 'No authenticated user';
  end if;

  -- Update the found invitation row to mark it as accepted.
  update invitations
  set status = 'accepted',
      accepted_at = now()
  where id = invite_record.id;

  -- Create (or update) the user profile using data from the invitation.
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