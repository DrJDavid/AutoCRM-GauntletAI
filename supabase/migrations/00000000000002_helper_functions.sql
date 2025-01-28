-- Function to validate and process team invitations
create or replace function validate_invite_by_email(
  email_param text,
  type_param invitation_type
)
returns table (
  organization_id uuid,
  role user_role,
  is_valid boolean
) as $$
begin
  return query
  select
    i.organization_id,
    i.role,
    (i.status = 'pending' and i.expires_at > now()) as is_valid
  from invitations i
  where i.email = email_param
    and i.type = type_param
    and i.status = 'pending'
    and i.expires_at > now()
  limit 1;
end;
$$ language plpgsql security definer;

-- Function to accept an invitation
create or replace function accept_invitation(
  email_param text,
  user_id uuid
)
returns uuid as $$
declare
  invite_record record;
  profile_id uuid;
begin
  -- Get and validate invitation
  select * into invite_record
  from invitations
  where email = email_param
    and status = 'pending'
    and expires_at > now()
  limit 1;

  if not found then
    raise exception 'No valid invitation found';
  end if;

  -- Update invitation status
  update invitations
  set status = 'accepted'
  where id = invite_record.id;

  -- Create profile
  insert into profiles (
    id,
    organization_id,
    role,
    email
  ) values (
    user_id,
    invite_record.organization_id,
    invite_record.role,
    email_param
  )
  returning id into profile_id;

  return profile_id;
end;
$$ language plpgsql security definer;

-- Function to assign ticket to agent
create or replace function assign_ticket(
  ticket_id_param uuid,
  agent_id_param uuid
)
returns void as $$
declare
  agent_org_id uuid;
  ticket_org_id uuid;
begin
  -- Get organization IDs
  select organization_id into agent_org_id
  from profiles
  where id = agent_id_param and role in ('agent', 'admin', 'head_admin');

  select organization_id into ticket_org_id
  from tickets
  where id = ticket_id_param;

  -- Validate assignment
  if agent_org_id is null then
    raise exception 'Invalid agent ID';
  end if;

  if ticket_org_id != agent_org_id then
    raise exception 'Agent and ticket must belong to the same organization';
  end if;

  -- Perform assignment
  update tickets
  set assigned_to = agent_id_param,
      updated_at = now()
  where id = ticket_id_param;
end;
$$ language plpgsql security definer;

-- Function to close ticket
create or replace function close_ticket(
  ticket_id_param uuid,
  closer_id uuid
)
returns void as $$
declare
  ticket_record record;
  closer_role user_role;
begin
  -- Get ticket details
  select * into ticket_record
  from tickets
  where id = ticket_id_param;

  -- Get closer role
  select role into closer_role
  from profiles
  where id = closer_id;

  -- Validate closure
  if not found then
    raise exception 'Ticket not found';
  end if;

  if closer_role = 'customer' and ticket_record.customer_id != closer_id then
    raise exception 'Customers can only close their own tickets';
  end if;

  -- Perform closure
  update tickets
  set status = 'closed',
      closed_at = now(),
      updated_at = now()
  where id = ticket_id_param;
end;
$$ language plpgsql security definer;

-- Function to get ticket statistics for an organization
create or replace function get_ticket_stats(org_id_param uuid)
returns table (
  total_tickets bigint,
  open_tickets bigint,
  closed_tickets bigint,
  avg_resolution_time interval
) as $$
  select
    count(*) as total_tickets,
    count(*) filter (where status != 'closed') as open_tickets,
    count(*) filter (where status = 'closed') as closed_tickets,
    avg(closed_at - created_at) filter (where status = 'closed') as avg_resolution_time
  from tickets
  where organization_id = org_id_param;
$$ language sql security definer;

-- Function to get agent performance metrics
create or replace function get_agent_performance(
  agent_id_param uuid,
  start_date timestamptz default (now() - interval '30 days'),
  end_date timestamptz default now()
)
returns table (
  tickets_handled bigint,
  avg_resolution_time interval,
  customer_satisfaction numeric
) as $$
  select
    count(*) as tickets_handled,
    avg(closed_at - created_at) filter (where status = 'closed') as avg_resolution_time,
    avg((metadata->>'satisfaction_rating')::numeric) filter (where metadata ? 'satisfaction_rating') as customer_satisfaction
  from tickets
  where assigned_to = agent_id_param
    and created_at between start_date and end_date;
$$ language sql security definer; 