-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Create enum types
create type user_role as enum ('head_admin', 'admin', 'agent', 'customer');
create type ticket_status as enum ('open', 'in_progress', 'pending', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');
create type invitation_type as enum ('team', 'customer');
create type invitation_status as enum ('pending', 'accepted', 'expired');

-- Create organizations table
create table organizations (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text unique not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    settings jsonb default '{}'::jsonb,
    metadata jsonb default '{}'::jsonb,
    is_active boolean default true
);

-- Create profiles table with strict organization relationship
create table profiles (
    id uuid primary key references auth.users on delete cascade,
    organization_id uuid references organizations on delete cascade,
    role user_role not null,
    first_name text,
    last_name text,
    email text not null unique,
    phone text,
    avatar_url text,
    title text,
    department text,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    last_seen_at timestamptz,
    is_active boolean default true,
    constraint proper_email check (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Create invitations table
create table invitations (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations on delete cascade not null,
    email text not null,
    role user_role not null,
    type invitation_type not null,
    status invitation_status default 'pending',
    invited_by uuid references auth.users not null,
    created_at timestamptz default now(),
    expires_at timestamptz default (now() + interval '7 days'),
    metadata jsonb default '{}'::jsonb,
    unique (organization_id, email, status)
);

-- Create tickets table
create table tickets (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations on delete cascade not null,
    customer_id uuid references profiles not null,
    assigned_to uuid references profiles,
    title text not null,
    description text,
    status ticket_status default 'open',
    priority ticket_priority default 'medium',
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    closed_at timestamptz,
    last_activity_at timestamptz default now()
);

-- Create ticket_messages table
create table ticket_messages (
    id uuid primary key default uuid_generate_v4(),
    ticket_id uuid references tickets on delete cascade not null,
    sender_id uuid references profiles not null,
    message text not null,
    is_internal boolean default false,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create ticket_attachments table
create table ticket_attachments (
    id uuid primary key default uuid_generate_v4(),
    ticket_id uuid references tickets on delete cascade not null,
    message_id uuid references ticket_messages on delete cascade,
    uploader_id uuid references profiles not null,
    file_name text not null,
    file_type text not null,
    file_size integer not null,
    storage_path text not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- Create AI agent configuration table
create table ai_agents (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations on delete cascade not null,
    name text not null,
    description text,
    is_active boolean default true,
    configuration jsonb default '{}'::jsonb,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique (organization_id, name)
);

-- Create AI agent assignments table
create table ai_agent_assignments (
    id uuid primary key default uuid_generate_v4(),
    agent_id uuid references ai_agents on delete cascade not null,
    ticket_id uuid references tickets on delete cascade not null,
    status text not null default 'active',
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique (agent_id, ticket_id)
);

-- Create AI agent responses table
create table ai_agent_responses (
    id uuid primary key default uuid_generate_v4(),
    assignment_id uuid references ai_agent_assignments on delete cascade not null,
    content text not null,
    confidence_score float,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- Create updated_at triggers
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers to all relevant tables
create trigger update_organizations_updated_at
    before update on organizations
    for each row execute function update_updated_at_column();

create trigger update_profiles_updated_at
    before update on profiles
    for each row execute function update_updated_at_column();

create trigger update_tickets_updated_at
    before update on tickets
    for each row execute function update_updated_at_column();

create trigger update_ticket_messages_updated_at
    before update on ticket_messages
    for each row execute function update_updated_at_column();

create trigger update_ai_agents_updated_at
    before update on ai_agents
    for each row execute function update_updated_at_column();

create trigger update_ai_agent_assignments_updated_at
    before update on ai_agent_assignments
    for each row execute function update_updated_at_column();

-- Create function to handle ticket activity updates
create or replace function update_ticket_last_activity()
returns trigger as $$
begin
    update tickets
    set last_activity_at = now()
    where id = new.ticket_id;
    return new;
end;
$$ language plpgsql;

-- Apply ticket activity trigger
create trigger update_ticket_activity_on_message
    after insert on ticket_messages
    for each row execute function update_ticket_last_activity();

create trigger update_ticket_activity_on_attachment
    after insert on ticket_attachments
    for each row execute function update_ticket_last_activity(); 