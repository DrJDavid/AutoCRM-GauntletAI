-- Create organizations table first
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  slug text not null unique,
  settings jsonb default '{}'::jsonb
);

-- Create profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  email text not null,
  role text not null check (role in ('admin', 'agent', 'customer')),
  organization_id uuid references public.organizations,
  full_name text,
  avatar_url text
);

-- Create tickets table
create table public.tickets (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  customer_id uuid references public.profiles not null,
  assigned_agent_id uuid references public.profiles,
  organization_id uuid references public.organizations not null,
  tags text[] default array[]::text[],
  metadata jsonb default '{}'::jsonb
);
-- Enable RLS after tables are created
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.tickets enable row level security;

-- Create RLS policies
-- Organizations policies
create policy "Organizations are viewable by organization members" 
  on organizations for select using (
    auth.uid() in (
      select profiles.id from profiles 
      where profiles.organization_id = organizations.id
    )
  );

create policy "Organizations can be created by anyone" 
  on organizations for insert with check (true);

-- Profiles policies
create policy "Profiles are viewable by organization members" 
  on profiles for select using (
    auth.uid() in (
      select p2.id from profiles p2 
      where p2.organization_id = profiles.organization_id
    )
    or auth.uid() = id
  );

create policy "Users can update their own profile" 
  on profiles for update using (auth.uid() = id);

create policy "Profiles can be created by authenticated users" 
  on profiles for insert with check (auth.uid() = id);

-- Tickets policies
create policy "Tickets are viewable by organization members and ticket owner" 
  on tickets for select using (
    auth.uid() in (
      select profiles.id from profiles 
      where profiles.organization_id = tickets.organization_id
    )
    or auth.uid() = customer_id
  );

create policy "Tickets can be created by authenticated users" 
  on tickets for insert with check (auth.uid() = customer_id);

create policy "Tickets can be updated by organization members" 
  on tickets for update using (
    auth.uid() in (
      select profiles.id from profiles 
      where profiles.organization_id = tickets.organization_id
    )
  );
-- Additional RLS policies for admin role

-- Organizations additional policies
create policy "Admins can perform all actions on organizations"
  on organizations for all using (
    auth.uid() in (
      select id from profiles where role = 'admin'
      and organization_id = organizations.id
    )
  );

-- Profiles additional policies
create policy "Admins can manage all profiles in their organization"
  on profiles for all using (
    auth.uid() in (
      select id from profiles where role = 'admin'
      and organization_id = profiles.organization_id
    )
  );

-- Tickets additional policies
create policy "Agents can view and update assigned tickets"
  on tickets for select using (
    auth.uid() in (
      select id from profiles 
      where role = 'agent' 
      and organization_id = tickets.organization_id
    )
  );

create policy "Agents can update assigned tickets"
  on tickets for update using (
    auth.uid() in (
      select id from profiles 
      where role = 'agent' 
      and organization_id = tickets.organization_id
    )
  );

create policy "Admins can perform all actions on tickets"
  on tickets for all using (
    auth.uid() in (
      select id from profiles 
      where role = 'admin'
      and organization_id = tickets.organization_id
    )
  );

-- Delete policies
create policy "Only admins can delete tickets"
  on tickets for delete using (
    auth.uid() in (
      select id from profiles 
      where role = 'admin'
      and organization_id = tickets.organization_id
    )
  );

create policy "Only admins can delete profiles"
  on profiles for delete using (
    auth.uid() in (
      select id from profiles 
      where role = 'admin'
      and organization_id = profiles.organization_id
    )
  );
-- Part 3: Functions, Triggers and Realtime
-- Functions and triggers (after tables and policies are set up)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, new.raw_user_meta_data->>'role');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger after user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable realtime last
alter publication supabase_realtime add table organizations;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table tickets;
create table public.ticket_messages (
    id uuid default gen_random_uuid() primary key,
    ticket_id uuid references public.tickets on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    content text not null,
    author_id uuid references public.profiles not null,
    is_internal boolean default false,
    metadata jsonb default '{}'::jsonb
);

alter table public.ticket_messages enable row level security;

create policy "Messages viewable by organization members and ticket owner"
    on ticket_messages for select using (
        exists (
            select 1 from tickets t
            join profiles p on (t.organization_id = p.organization_id)
            where t.id = ticket_messages.ticket_id
            and (p.id = auth.uid() or t.customer_id = auth.uid())
        )
    );
select * from information_schema.tables where table_name = 'ticket_messages';
create table public.knowledge_articles (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations not null,
    title text not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    author_id uuid references public.profiles,
    status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
    tags text[] default array[]::text[],
    metadata jsonb default '{}'::jsonb
);

alter table public.knowledge_articles enable row level security;

create policy "Articles viewable by organization members"
    on knowledge_articles for select using (
        exists (
            select 1 from profiles
            where organization_id = knowledge_articles.organization_id
            and id = auth.uid()
        )
    );

create policy "Articles editable by admins and agents"
    on knowledge_articles for all using (
        exists (
            select 1 from profiles
            where organization_id = knowledge_articles.organization_id
            and id = auth.uid()
            and role in ('admin', 'agent')
        )
    );
create table public.teams (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations not null,
    name text not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    metadata jsonb default '{}'::jsonb
);

create table public.team_members (
    team_id uuid references public.teams on delete cascade,
    profile_id uuid references public.profiles on delete cascade,
    role text not null default 'member' check (role in ('leader', 'member')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (team_id, profile_id)
);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

create policy "Teams viewable by organization members"
    on teams for select using (
        exists (
            select 1 from profiles
            where organization_id = teams.organization_id
            and id = auth.uid()
        )
    );

create policy "Team members viewable by organization members"
    on team_members for select using (
        exists (
            select 1 from teams t
            join profiles p on t.organization_id = p.organization_id
            where t.id = team_members.team_id
            and p.id = auth.uid()
        )
    );
-- Core table indexes
create index idx_tickets_customer on tickets(customer_id);
create index idx_tickets_agent on tickets(assigned_agent_id);
create index idx_tickets_org_status on tickets(organization_id, status);
create index idx_tickets_org_priority on tickets(organization_id, priority);
create index idx_tickets_created_at on tickets(created_at desc);

-- Support table indexes
create index idx_ticket_messages_ticket on ticket_messages(ticket_id);
create index idx_knowledge_articles_org on knowledge_articles(organization_id);
create index idx_team_members_profile on team_members(profile_id);

-- Array and JSONB indexes for better performance
create index idx_tickets_tags on tickets using gin (tags);
create index idx_knowledge_articles_tags on knowledge_articles using gin (tags);
create index idx_tickets_metadata on tickets using gin (metadata jsonb_path_ops);
create index idx_knowledge_articles_metadata on knowledge_articles using gin (metadata jsonb_path_ops);
-- Ticket statistics view
create view public.ticket_stats as
select 
    organization_id,
    status,
    priority,
    count(*) as ticket_count,
    avg(extract(epoch from (updated_at - created_at))) as avg_resolution_time
from tickets
group by organization_id, status, priority;

-- Agent performance metrics view
create view public.agent_performance as
select 
    t.assigned_agent_id,
    p.full_name as agent_name,
    count(*) as total_tickets,
    count(*) filter (where t.status = 'resolved') as resolved_tickets,
    avg(extract(epoch from (t.updated_at - t.created_at))) as avg_resolution_time,
    t.organization_id
from tickets t
join profiles p on t.assigned_agent_id = p.id
group by t.assigned_agent_id, p.full_name, t.organization_id;

-- Team performance view
create view public.team_performance as
select 
    tm.team_id,
    t.name as team_name,
    count(distinct tm.profile_id) as team_size,
    count(tix.id) as total_tickets,
    count(tix.id) filter (where tix.status = 'resolved') as resolved_tickets
from teams t
left join team_members tm on t.id = tm.team_id
left join tickets tix on tm.profile_id = tix.assigned_agent_id
group by tm.team_id, t.name;
-- Ticket assignment with logging
create or replace function public.assign_ticket(
    ticket_id uuid,
    agent_id uuid
) returns void as $$
begin
    -- Check permissions
    if not exists (
        select 1 from profiles
        where id = auth.uid()
        and organization_id = (select organization_id from tickets where id = ticket_id)
        and role in ('admin', 'agent')
    ) then
        raise exception 'Unauthorized';
    end if;

    update tickets
    set 
        assigned_agent_id = agent_id,
        status = case when status = 'open' then 'in_progress' else status end,
        updated_at = now()
    where id = ticket_id;
end;
$$ language plpgsql security definer;

-- Update ticket status with validation
create or replace function public.update_ticket_status(
    ticket_id uuid,
    new_status text
) returns void as $$
begin
    if new_status not in ('open', 'in_progress', 'resolved', 'closed') then
        raise exception 'Invalid status';
    end if;

    -- Check permissions
    if not exists (
        select 1 from profiles
        where id = auth.uid()
        and organization_id = (select organization_id from tickets where id = ticket_id)
        and role in ('admin', 'agent')
    ) then
        raise exception 'Unauthorized';
    end if;

    update tickets
    set 
        status = new_status,
        updated_at = now()
    where id = ticket_id;
end;
$$ language plpgsql security definer;

-- Add comment/message to ticket
create or replace function public.add_ticket_message(
    ticket_id uuid,
    message_content text,
    is_internal boolean default false
) returns uuid as $$
declare
    new_message_id uuid;
begin
    -- Check permissions
    if not exists (
        select 1 from tickets t
        join profiles p on t.organization_id = p.organization_id
        where t.id = ticket_id
        and (p.id = auth.uid() or t.customer_id = auth.uid())
    ) then
        raise exception 'Unauthorized';
    end if;

    insert into ticket_messages (
        ticket_id,
        content,
        author_id,
        is_internal
    ) values (
        ticket_id,
        message_content,
        auth.uid(),
        is_internal
    )
    returning id into new_message_id;

    -- Update ticket timestamp
    update tickets
    set updated_at = now()
    where id = ticket_id;

    return new_message_id;
end;
$$ language plpgsql security definer;

-- Get ticket summary with latest message
create or replace function public.get_ticket_summary(
    ticket_id uuid
) returns json as $$
declare
    result json;
begin
    select json_build_object(
        'ticket', t,
        'latest_message', (
            select json_build_object(
                'content', tm.content,
                'created_at', tm.created_at,
                'author', json_build_object(
                    'id', p.id,
                    'name', p.full_name,
                    'role', p.role
                )
            )
            from ticket_messages tm
            join profiles p on tm.author_id = p.id
            where tm.ticket_id = t.id
            order by tm.created_at desc
            limit 1
        ),
        'customer', json_build_object(
            'id', c.id,
            'name', c.full_name,
            'email', c.email
        ),
        'agent', case 
            when t.assigned_agent_id is not null then
                json_build_object(
                    'id', a.id,
                    'name', a.full_name,
                    'email', a.email
                )
            else null
        end
    ) into result
    from tickets t
    join profiles c on t.customer_id = c.id
    left join profiles a on t.assigned_agent_id = a.id
    where t.id = ticket_id;

    return result;
end;
$$ language plpgsql security definer;

-- Calculate SLA status
create or replace function public.calculate_ticket_sla_status(
    created_at timestamp with time zone,
    priority text,
    status text
) returns text as $$
declare
    sla_threshold interval;
    current_duration interval;
begin
    -- Define SLA thresholds based on priority
    sla_threshold := case priority
        when 'urgent' then interval '2 hours'
        when 'high' then interval '4 hours'
        when 'medium' then interval '8 hours'
        when 'low' then interval '24 hours'
    end;

    -- Calculate current duration for open tickets
    if status not in ('resolved', 'closed') then
        current_duration := now() - created_at;
        
        return case
            when current_duration > sla_threshold then 'breached'
            when current_duration > sla_threshold * 0.8 then 'at_risk'
            else 'on_track'
        end;
    end if;

    return 'completed';
end;
$$ language plpgsql immutable;
-- Add only the new tables to realtime
alter publication supabase_realtime add table ticket_messages;
alter publication supabase_realtime add table knowledge_articles;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table team_members;
-- Auto-update timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Add triggers for tables that need updated_at maintained
create trigger set_timestamp
    before update on tickets
    for each row
    execute function handle_updated_at();

create trigger set_timestamp
    before update on knowledge_articles
    for each row
    execute function handle_updated_at();

-- Trigger for logging significant changes
create or replace function public.log_ticket_changes()
returns trigger as $$
begin
    if (old.status != new.status) or (old.assigned_agent_id != new.assigned_agent_id) then
        insert into ticket_messages (
            ticket_id,
            content,
            author_id,
            is_internal,
            metadata
        ) values (
            new.id,
            case 
                when old.status != new.status 
                    then format('Status changed from %s to %s', old.status, new.status)
                else format('Assigned to %s', (select full_name from profiles where id = new.assigned_agent_id))
            end,
            auth.uid(),
            true,
            jsonb_build_object(
                'change_type', case 
                    when old.status != new.status then 'status_change'
                    else 'assignment_change'
                end
            )
        );
    end if;
    return new;
end;
$$ language plpgsql security definer;

create trigger log_ticket_changes
    after update on tickets
    for each row
    when (old.status is distinct from new.status or old.assigned_agent_id is distinct from new.assigned_agent_id)
    execute function log_ticket_changes();
-- Allow users to create their own profile
create policy "Users can create their own profile"
on profiles for insert
with check (auth.uid() = id);

-- Allow users to view profiles in their organization or their own profile
create policy "Users can view profiles in their organization"
on profiles for select
using (
  organization_id in (
    select organization_id from profiles where id = auth.uid()
  )
  or id = auth.uid()
);

-- Allow users to update their own profile
create policy "Users can update their own profile"
on profiles for update
using (auth.uid() = id);
-- First, drop all existing policies for the profiles table
drop policy if exists "Profiles are viewable by organization members" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Profiles can be created by authenticated users" on profiles;
drop policy if exists "Users can create their own profile" on profiles;
drop policy if exists "Users can view profiles in their organization" on profiles;
-- Then create our new simplified policies
create policy "Enable insert for authenticated users"
on profiles for insert
with check (auth.uid() = id);
create policy "Enable select for users in same organization"
on profiles for select
using (
  (organization_id is not null and organization_id in (
    select organization_id from profiles where id = auth.uid()
  ))
  or auth.uid() = id
);
create policy "Enable update for users based on id"
on profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);
-- First, drop all organization policies
drop policy if exists "Organizations are viewable by organization members" on organizations;
drop policy if exists "Organizations can be created by anyone" on organizations;

-- Create new organization policies
create policy "Enable all operations for organizations"
on organizations for all
using (true)
with check (true);

-- Drop profile policies again (in case any remained)
drop policy if exists "Enable insert for authenticated users" on profiles;
drop policy if exists "Enable select for users in same organization" on profiles;
drop policy if exists "Enable update for users based on id" on profiles;

-- Create new simplified profile policies
create policy "Enable all operations for profiles"
on profiles for all
using (true)
with check (true);
-- Function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    role
  ) values (
    new.id,
    new.email,
    coalesce(
      (new.raw_user_meta_data->>'role')::text,
      'customer'
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%invite%';
drop function if exists public.create_customer_invite(uuid, text);
-- Then recreate it
create or replace function public.create_customer_invite(
    org_id uuid,
    customer_email text
) returns uuid as $$
declare
    invite_token uuid;
begin
    -- Check if user has permission
    if not exists (
        select 1 from profiles
        where id = auth.uid()
        and organization_id = org_id
        and role in ('admin', 'agent')
    ) then
        raise exception 'Unauthorized';
    end if;

    -- Create invite
    insert into customer_organization_invites (
        organization_id,
        email,
        expires_at
    ) values (
        org_id,
        customer_email,
        now() + interval '7 days'
    ) returning token into invite_token;

    return invite_token;
end;
$$ language plpgsql security definer;
-- Finally grant access
grant execute on function public.create_customer_invite(org_id uuid, customer_email text) to authenticated;
create table public.customer_organization_invites (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations not null,
    email text not null,
    token uuid default gen_random_uuid() not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone not null,
    accepted boolean default false,
    unique(organization_id, email)
);
alter table public.customer_organization_invites enable row level security;

create policy "Invites viewable by organization members and invitee"
  on customer_organization_invites for select using (
    auth.uid() in (
      select profiles.id from profiles 
      where profiles.organization_id = customer_organization_invites.organization_id
    )
    or email = auth.email()
  );

create policy "Invites creatable by organization members"
  on customer_organization_invites for insert with check (
    auth.uid() in (
      select profiles.id from profiles 
      where profiles.organization_id = organization_id
      and role in ('admin', 'agent')
    )
  );

create policy "Invites updatable by organization members"
  on customer_organization_invites for update using (
    auth.uid() in (
      select profiles.id from profiles 
      where profiles.organization_id = organization_id
      and role in ('admin', 'agent')
    )
  );
create or replace function public.create_customer_invite(
    org_id uuid,
    customer_email text
) returns uuid as $$
declare
    invite_token uuid;
begin
    -- Check if user has permission
    if not exists (
        select 1 from profiles
        where id = auth.uid()
        and organization_id = org_id
        and role in ('admin', 'agent')
    ) then
        raise exception 'Unauthorized';
    end if;

    -- Create invite
    insert into customer_organization_invites (
        organization_id,
        email,
        expires_at
    ) values (
        org_id,
        customer_email,
        now() + interval '7 days'
    ) returning token into invite_token;

    return invite_token;
end;
$$ language plpgsql security definer;

create or replace function public.accept_customer_invite(
    invite_token uuid
) returns void as $$
declare
    invite_record record;
begin
    -- Get and validate invite
    select * into invite_record
    from customer_organization_invites
    where token = invite_token
    and not accepted
    and expires_at > now();

    if not found then
        raise exception 'Invalid or expired invite';
    end if;

    -- Create customer organization relationship
    insert into customer_organizations (
        customer_id,
        organization_id
    ) values (
        auth.uid(),
        invite_record.organization_id
    );

    -- Mark invite as accepted
    update customer_organization_invites
    set accepted = true
    where token = invite_token;
end;
$$ language plpgsql security definer;
grant execute on function public.create_customer_invite(org_id uuid, customer_email text) to authenticated;
grant execute on function public.accept_customer_invite(invite_token uuid) to authenticated;
-- Drop the existing trigger if it exists
drop trigger if exists on_customer_invite_created on customer_organization_invites;

-- Create email trigger for customer invites
create or replace function notify_customer_invite()
returns trigger as $$
declare
  org_name text;
begin
  -- Get organization name
  select name into org_name
  from organizations
  where id = NEW.organization_id;

  -- Send email using Supabase's built-in email service
  perform net.http_post(
    url := 'https://lhrslwpgyghhbfedytzv.supabase.co/rest/v1/rpc/send_email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claim.role')
    ),
    body := jsonb_build_object(
      'to', NEW.email,
      'subject', 'Invitation to join ' || org_name || ' on AutoCRM',
      'html_content', format(
        '<h1>You''ve been invited!</h1>
        <p>You''ve been invited to join %s on AutoCRM.</p>
        <p>Click the link below to accept the invitation:</p>
        <a href="%s/auth/accept-invite?token=%s">Accept Invitation</a>
        <p>This invite expires on %s</p>',
        org_name,
        current_setting('app.settings.public_url'),
        NEW.token,
        NEW.expires_at::text
      )
    )
  );
  
  return NEW;
end;
$$ language plpgsql security definer;

-- Create the trigger
create trigger on_customer_invite_created
  after insert on customer_organization_invites
  for each row
  execute function notify_customer_invite();

-- Create customer_organizations table
create table if not exists public.customer_organizations (
    id uuid default gen_random_uuid() primary key,
    customer_id uuid references public.profiles not null,
    organization_id uuid references public.organizations not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    status text not null default 'active' check (status in ('active', 'inactive')),
    unique(customer_id, organization_id)
);

alter table public.customer_organizations enable row level security;

create policy "Customers can view their own organizations"
  on customer_organizations for select using (
    auth.uid() = customer_id
  );

create policy "Organization members can view customer relationships"
  on customer_organizations for select using (
    auth.uid() in (
      select profiles.id from profiles 
      where profiles.organization_id = customer_organizations.organization_id
    )
  );