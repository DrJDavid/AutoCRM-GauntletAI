-- Migration: Add ticket attachments support
-- Description: Creates tables and policies for handling file attachments on tickets and comments

-- Create attachments table
CREATE TABLE attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES ticket_comments(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  -- Either ticket_id or comment_id must be set, but not both
  CONSTRAINT attachment_parent_check CHECK (
    (ticket_id IS NOT NULL AND comment_id IS NULL) OR
    (ticket_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Add RLS policies for attachments
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Allow users to view attachments if they have access to the related ticket
CREATE POLICY "Users can view attachments for tickets they have access to" ON attachments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Allow users to upload attachments if they have access to the related ticket
CREATE POLICY "Users can upload attachments" ON attachments
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Storage bucket policies
-- Note: Create the 'ticket-attachments' bucket in Supabase dashboard first
CREATE POLICY "Users can upload files to their organization" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ticket-attachments' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = (
      SELECT organization_id::text 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view files from their organization" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'ticket-attachments' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = (
      SELECT organization_id::text 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Add indexes for better query performance
CREATE INDEX idx_attachments_ticket_id ON attachments(ticket_id);
CREATE INDEX idx_attachments_comment_id ON attachments(comment_id);
CREATE INDEX idx_attachments_organization_id ON attachments(organization_id);
