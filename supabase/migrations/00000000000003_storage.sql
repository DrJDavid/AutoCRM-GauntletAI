-- Enable the storage extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create storage bucket for ticket attachments
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ticket-attachments',
  'ticket-attachments',
  false,
  10485760, -- 10MB
  array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip'
  ]
)
on conflict (id) do nothing;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Enable RLS on ticket_attachments
alter table public.ticket_attachments enable row level security;

-- Policy: Users can read files from tickets they have access to
create policy "ticket_files_select"
  on storage.objects for select
  using (
    bucket_id = 'ticket-attachments' 
    and (
      exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
        and p.role in ('admin', 'agent', 'head_admin')
      )
      or
      exists (
        select 1 from public.tickets t
        where t.id::text = split_part(name, '/', 1)
        and t.customer_id = auth.uid()
      )
    )
  );

-- Policy: Users can upload files to tickets they have access to
create policy "ticket_files_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'ticket-attachments'
    and (
      exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
        and p.role in ('admin', 'agent', 'head_admin')
      )
      or
      exists (
        select 1 from public.tickets t
        where t.id::text = split_part(name, '/', 1)
        and t.customer_id = auth.uid()
      )
    )
  );

-- Policy: Users can delete their own uploads or if they're admin
create policy "ticket_files_delete"
  on storage.objects for delete
  using (
    bucket_id = 'ticket-attachments'
    and (
      exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
        and p.role = 'admin'
      )
      or
      exists (
        select 1 from public.ticket_attachments ta
        where ta.storage_path = name
        and ta.uploader_id = auth.uid()
      )
    )
  );

-- Policies for ticket_attachments table
create policy "ticket_attachments_select"
  on public.ticket_attachments for select
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
      and (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
          and p.role in ('admin', 'agent', 'head_admin')
        )
        or t.customer_id = auth.uid()
      )
    )
  );

create policy "ticket_attachments_insert"
  on public.ticket_attachments for insert
  with check (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
      and (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
          and p.role in ('admin', 'agent', 'head_admin')
        )
        or t.customer_id = auth.uid()
      )
    )
    and uploader_id = auth.uid() -- Ensure uploader_id matches the current user
  );

create policy "ticket_attachments_delete"
  on public.ticket_attachments for delete
  using (
    uploader_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  ); 