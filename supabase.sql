-- Part 1: Table Creation
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

-- Part 2: Enable RLS and Create Policies
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