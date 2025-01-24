-- Migration: Add ticket comments support
-- Description: Creates tables and policies for ticket comments

-- Create ticket comments table
CREATE TABLE ticket_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES profiles(id) NOT NULL,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- For agent-only notes
    edited_at TIMESTAMPTZ,
    parent_comment_id UUID REFERENCES ticket_comments(id) -- For threaded replies
);

-- Add RLS policies
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments for tickets in their organization
CREATE POLICY "Users can view comments for tickets they have access to" ON ticket_comments
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND (
            NOT is_internal -- Non-internal comments are visible to all org members
            OR 
            author_id = auth.uid() -- Author can see their own internal comments
            OR 
            EXISTS ( -- Agents can see internal comments
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role = 'agent'
            )
        )
    );

-- Users can create comments on tickets in their organization
CREATE POLICY "Users can create comments" ON ticket_comments
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        AND author_id = auth.uid()
        AND (
            NOT is_internal -- Regular users can only create non-internal comments
            OR 
            EXISTS ( -- Only agents can create internal comments
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role = 'agent'
            )
        )
    );

-- Users can edit their own comments
CREATE POLICY "Users can edit their own comments" ON ticket_comments
    FOR UPDATE USING (
        author_id = auth.uid()
    )
    WITH CHECK (
        author_id = auth.uid()
        AND organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Add indexes for better query performance
CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_author_id ON ticket_comments(author_id);
CREATE INDEX idx_ticket_comments_organization_id ON ticket_comments(organization_id);
CREATE INDEX idx_ticket_comments_parent_comment_id ON ticket_comments(parent_comment_id);

-- Add trigger to update edited_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_comment_edited_at()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content IS DISTINCT FROM NEW.content THEN
        NEW.edited_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_comment_edited_at
    BEFORE UPDATE ON ticket_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_comment_edited_at();
