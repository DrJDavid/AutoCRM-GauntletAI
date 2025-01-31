-- Drop the old invitations table constraints and type
alter table invitations drop constraint if exists invitations_organization_id_email_status_key;
drop type if exists invitation_type cascade;
drop type if exists invitation_status cascade;

-- Create new enum types
create type invitation_type as enum ('agent', 'customer');
create type invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

-- Update invitations table with new columns
alter table invitations 
  add column if not exists token uuid default uuid_generate_v4(),
  add column if not exists accepted_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists message text,
  add column if not exists type invitation_type,
  add column if not exists status invitation_status default 'pending';

-- Set default values for existing invitations
update invitations 
set type = 'agent',
    status = 'pending'
where type is null or status is null;

-- Make columns not null after setting defaults
alter table invitations 
  alter column type set not null,
  alter column status set not null;

-- Add new constraints
alter table invitations
  add constraint invitations_organization_id_email_type_key unique (organization_id, email, type),
  add constraint invitations_token_key unique (token);

-- Create indexes for common queries
create index if not exists idx_invitations_org_type_status on invitations(organization_id, type, status);
create index if not exists idx_invitations_email on invitations(email);
create index if not exists idx_invitations_token on invitations(token);

-- Create function to automatically expire invitations
create or replace function expire_invitations() returns trigger as $$
begin
  update invitations
  set status = 'expired'
  where expires_at < now()
  and status = 'pending';
  return null;
end;
$$ language plpgsql;

-- Create trigger to automatically expire invitations
drop trigger if exists trigger_expire_invitations on invitations;
create trigger trigger_expire_invitations
  after insert or update on invitations
  for each statement
  execute function expire_invitations();

-- Create view for agent invites
create or replace view agent_organization_invites as
select 
  id,
  organization_id,
  email,
  role,
  status,
  invited_by,
  created_at,
  expires_at,
  token,
  accepted_at,
  cancelled_at,
  message,
  metadata
from invitations
where type = 'agent'
and status = 'pending';

-- Create view for customer invites
create or replace view customer_organization_invites as
select 
  id,
  organization_id,
  email,
  role,
  status,
  invited_by,
  created_at,
  expires_at,
  token,
  accepted_at,
  cancelled_at,
  message,
  metadata
from invitations
where type = 'customer'
and status = 'pending';

-- Add RLS policies for the views
alter table invitations enable row level security;

create policy "Admins can view all invitations for their organization"
  on invitations for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.organization_id = invitations.organization_id
      and profiles.role in ('head_admin', 'admin')
    )
  );

create policy "Admins can create invitations for their organization"
  on invitations for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.organization_id = invitations.organization_id
      and profiles.role in ('head_admin', 'admin')
    )
  );

create policy "Admins can update invitations for their organization"
  on invitations for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.organization_id = invitations.organization_id
      and profiles.role in ('head_admin', 'admin')
    )
  );

-- Add helper functions
create or replace function accept_invitation(invitation_token uuid)
returns uuid as $$
declare
  invite_record invitations;
  user_id uuid;
begin
  -- Get and validate invitation
  select * into invite_record
  from invitations
  where token = invitation_token
  and status = 'pending'
  and expires_at > now()
  for update;

  if not found then
    raise exception 'Invalid or expired invitation';
  end if;

  -- Get user ID from auth context
  user_id := auth.uid();
  if user_id is null then
    raise exception 'No authenticated user';
  end if;

  -- Update invitation status
  update invitations
  set status = 'accepted',
      accepted_at = now()
  where token = invitation_token;

  -- Update or create profile
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