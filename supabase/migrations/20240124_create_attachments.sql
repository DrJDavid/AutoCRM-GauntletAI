-- Create attachments table and related functionality
-- This migration adds support for file attachments on tickets

-- migrate:up
BEGIN;

-- Record this migration
INSERT INTO schema_version (version, description)
VALUES ('20240124_create_attachments', 'Create attachments table and policies')
ON CONFLICT (version) DO NOTHING;

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    content_type TEXT,
    size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attachments
CREATE POLICY "view_attachments" ON attachments
FOR SELECT USING (
    -- Users can view attachments if they can view the associated ticket
    EXISTS (
        SELECT 1 FROM tickets
        WHERE tickets.id = attachments.ticket_id
        AND (
            -- Customer owns the ticket
            tickets.customer_id = auth.uid()
            OR
            -- Agent/admin is in the same organization
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.organization_id = tickets.organization_id
                AND profiles.role IN ('agent', 'admin')
            )
        )
    )
);

CREATE POLICY "create_attachments" ON attachments
FOR INSERT WITH CHECK (
    -- Users can create attachments if they can update the associated ticket
    EXISTS (
        SELECT 1 FROM tickets
        WHERE tickets.id = attachments.ticket_id
        AND (
            -- Customer owns the ticket
            tickets.customer_id = auth.uid()
            OR
            -- Agent/admin is in the same organization
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.organization_id = tickets.organization_id
                AND profiles.role IN ('agent', 'admin')
            )
        )
    )
);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_attachments_updated_at
    BEFORE UPDATE ON attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- migrate:down
BEGIN;
    DROP TRIGGER IF EXISTS update_attachments_updated_at ON attachments;
    DROP FUNCTION IF EXISTS update_updated_at_column();
    DROP POLICY IF EXISTS "view_attachments" ON attachments;
    DROP POLICY IF EXISTS "create_attachments" ON attachments;
    DROP TABLE IF EXISTS attachments;
END;
