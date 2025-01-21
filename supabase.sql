-- AutoCRM Complete Database Schema
-- A multi-tenant CRM system with organization isolation and role-based access control

-- Part 1: Core Tables
-- Organizations: The top-level entity for multi-tenancy
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  slug text not null unique,
  settings jsonb default '{}'::jsonb
);

-- Profiles: Extends Supabase auth.users with additional fields
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  email text not null,
  role text not null check (role in ('admin', 'agent', 'customer')),
  organization_id uuid references public.organizations,
  full_name text,
  avatar_url text
);

-- Tickets: Core ticketing functionality
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

-- Part 2: Support Tables
-- Ticket Messages: Conversation history and internal notes
create table public.ticket_messages (
    id uuid default gen_random_uuid() primary key,
    ticket_id uuid references public.tickets on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    content text not null,
    author_id uuid references public.profiles not null,
    is_internal boolean default false,
    metadata jsonb default '{}'::jsonb
);

-- Knowledge Base: Self-service support articles
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

-- Teams: Department/Group organization
create table public.teams (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations not null,
    name text not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    metadata jsonb default '{}'::jsonb
);

-- Team Members: Team composition and roles
create table public.team_members (
    team_id uuid references public.teams on delete cascade,
    profile_id uuid references public.profiles on delete cascade,
    role text not null default 'member' check (role in ('leader', 'member')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (team_id, profile_id)
);

-- Part 3: Row Level Security Policies
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.knowledge_articles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- Organization Policies
create policy "Organizations are viewable by organization members" 
  on organizations for select using (
    auth.uid() in (
      select profiles.id from profiles 
      where profiles.organization_id = organizations.id
    )
  );

create policy "Organizations can be created by anyone" 
  on organizations for insert with check (true);

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

-- Ticket Policies
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

-- Message Policies
create policy "Messages viewable by organization members and ticket owner"
    on ticket_messages for select using (
        exists (
            select 1 from tickets t
            join profiles p on (t.organization_id = p.organization_id)
            where t.id = ticket_messages.ticket_id
            and (p.id = auth.uid() or t.customer_id = auth.uid())
        )
    );

-- Knowledge Base Policies
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

-- Team Policies
create policy "Teams viewable by organization members"
    on teams for select using (
        exists (
            select 1 from profiles
            where organization_id = teams.organization_id
            and id = auth.uid()
        )
    );

-- Part 4: Indexes
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

-- Array and JSONB indexes
create index idx_tickets_tags on tickets using gin (tags);
create index idx_knowledge_articles_tags on knowledge_articles using gin (tags);
create index idx_tickets_metadata on tickets using gin (metadata jsonb_path_ops);
create index idx_knowledge_articles_metadata on knowledge_articles using gin (metadata jsonb_path_ops);

-- Part 5: Views
-- Ticket Statistics
create view public.ticket_stats as
select 
    organization_id,
    status,
    priority,
    count(*) as ticket_count,
    avg(extract(epoch from (updated_at - created_at))) as avg_resolution_time
from tickets
group by organization_id, status, priority;

-- Agent Performance
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

-- Team Performance
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

-- Part 6: Functions
-- Ticket Assignment
create or replace function public.assign_ticket(
    ticket_id uuid,
    agent_id uuid
) returns void as $$
begin
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

-- Status Update
create or replace function public.update_ticket_status(
    ticket_id uuid,
    new_status text
) returns void as $$
begin
    if new_status not in ('open', 'in_progress', 'resolved', 'closed') then
        raise exception 'Invalid status';
    end if;

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

-- Part 7: Triggers
-- Auto-update timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_timestamp
    before update on tickets
    for each row
    execute function handle_updated_at();

create trigger set_timestamp
    before update on knowledge_articles
    for each row
    execute function handle_updated_at();

-- Log ticket changes
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

-- Part 8: Enable Realtime
alter publication supabase_realtime add table ticket_messages;
alter publication supabase_realtime add table knowledge_articles;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table team_members;