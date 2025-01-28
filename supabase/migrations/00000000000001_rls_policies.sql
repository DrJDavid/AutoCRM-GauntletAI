-- Enable RLS on all tables
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table invitations enable row level security;
alter table tickets enable row level security;
alter table ticket_messages enable row level security;
alter table ticket_attachments enable row level security;
alter table ai_agents enable row level security;
alter table ai_agent_assignments enable row level security;
alter table ai_agent_responses enable row level security;

-- Helper function to get user's organization_id
create or replace function get_user_organization_id()
returns uuid as $$
  select organization_id
  from profiles
  where id = auth.uid();
$$ language sql security definer;

-- Helper function to get user's role
create or replace function get_user_role()
returns user_role as $$
  select role
  from profiles
  where id = auth.uid();
$$ language sql security definer;

-- Helper function to check if user is admin or higher
create or replace function is_admin_or_higher()
returns boolean as $$
  select role in ('admin', 'head_admin')
  from profiles
  where id = auth.uid();
$$ language sql security definer;

-- Organizations Policies
create policy "Organization visible to its members"
  on organizations for select
  using (id in (
    select organization_id
    from profiles
    where id = auth.uid()
  ));

create policy "Organization editable by admins"
  on organizations for update
  using (id in (
    select organization_id
    from profiles
    where id = auth.uid() and role in ('admin', 'head_admin')
  ));

-- Profiles Policies
create policy "Profiles visible to organization members"
  on profiles for select
  using (organization_id = get_user_organization_id());

create policy "Profile editable by self or admin"
  on profiles for update
  using (
    id = auth.uid() or
    (organization_id = get_user_organization_id() and is_admin_or_higher())
  );

create policy "Profile insertable by system on invite accept"
  on profiles for insert
  with check (true);  -- Controlled by auth hook

-- Invitations Policies
create policy "Invitations viewable by organization admins"
  on invitations for select
  using (
    organization_id = get_user_organization_id() and
    is_admin_or_higher()
  );

create policy "Invitations creatable by organization admins"
  on invitations for insert
  with check (
    organization_id = get_user_organization_id() and
    is_admin_or_higher()
  );

create policy "Invitations updatable by organization admins"
  on invitations for update
  using (
    organization_id = get_user_organization_id() and
    is_admin_or_higher()
  );

-- Tickets Policies
create policy "Tickets visible to organization members"
  on tickets for select
  using (
    organization_id = get_user_organization_id() and
    (
      is_admin_or_higher() or  -- Admins see all tickets
      customer_id = auth.uid() or  -- Customers see own tickets
      assigned_to = auth.uid() or  -- Agents see assigned tickets
      get_user_role() = 'agent'  -- Agents see all tickets
    )
  );

create policy "Tickets creatable by customers and team members"
  on tickets for insert
  with check (
    organization_id = get_user_organization_id()
  );

create policy "Tickets updatable by team members"
  on tickets for update
  using (
    organization_id = get_user_organization_id() and
    get_user_role() != 'customer'
  );

-- Ticket Messages Policies
create policy "Messages visible to ticket participants"
  on ticket_messages for select
  using (
    exists (
      select 1 from tickets
      where tickets.id = ticket_messages.ticket_id
      and tickets.organization_id = get_user_organization_id()
      and (
        is_admin_or_higher() or
        tickets.customer_id = auth.uid() or
        tickets.assigned_to = auth.uid() or
        get_user_role() = 'agent'
      )
    )
  );

create policy "Messages creatable by ticket participants"
  on ticket_messages for insert
  with check (
    exists (
      select 1 from tickets
      where tickets.id = ticket_messages.ticket_id
      and tickets.organization_id = get_user_organization_id()
    )
  );

-- Ticket Attachments Policies
create policy "Attachments visible to ticket participants"
  on ticket_attachments for select
  using (
    exists (
      select 1 from tickets
      where tickets.id = ticket_attachments.ticket_id
      and tickets.organization_id = get_user_organization_id()
      and (
        is_admin_or_higher() or
        tickets.customer_id = auth.uid() or
        tickets.assigned_to = auth.uid() or
        get_user_role() = 'agent'
      )
    )
  );

create policy "Attachments creatable by ticket participants"
  on ticket_attachments for insert
  with check (
    exists (
      select 1 from tickets
      where tickets.id = ticket_attachments.ticket_id
      and tickets.organization_id = get_user_organization_id()
    )
  );

-- AI Agents Policies
create policy "AI agents visible to organization members"
  on ai_agents for select
  using (organization_id = get_user_organization_id());

create policy "AI agents manageable by admins"
  on ai_agents for all
  using (
    organization_id = get_user_organization_id() and
    is_admin_or_higher()
  );

-- AI Agent Assignments Policies
create policy "AI assignments visible to organization members"
  on ai_agent_assignments for select
  using (
    exists (
      select 1 from ai_agents
      where ai_agents.id = ai_agent_assignments.agent_id
      and ai_agents.organization_id = get_user_organization_id()
    )
  );

create policy "AI assignments manageable by team members"
  on ai_agent_assignments for all
  using (
    exists (
      select 1 from ai_agents
      where ai_agents.id = ai_agent_assignments.agent_id
      and ai_agents.organization_id = get_user_organization_id()
      and get_user_role() != 'customer'
    )
  );

-- AI Agent Responses Policies
create policy "AI responses visible to organization members"
  on ai_agent_responses for select
  using (
    exists (
      select 1 from ai_agent_assignments
      join ai_agents on ai_agents.id = ai_agent_assignments.agent_id
      where ai_agent_assignments.id = ai_agent_responses.assignment_id
      and ai_agents.organization_id = get_user_organization_id()
    )
  );

create policy "AI responses insertable by system"
  on ai_agent_responses for insert
  with check (true);  -- Controlled by service role 