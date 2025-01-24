-- Drop existing messages table if it exists
DROP TABLE IF EXISTS messages CASCADE;

-- Create messages table for ticket chat
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy for inserting messages
-- Customers can only insert messages on their own tickets
-- Organization members can insert messages on tickets in their organization
CREATE POLICY "Users can insert messages on accessible tickets" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = messages.ticket_id
            AND (
                -- Customer can only message their own tickets
                t.customer_id = auth.uid()
                OR
                -- Organization member can message any ticket in their organization
                t.organization_id = (
                    SELECT organization_id 
                    FROM profiles 
                    WHERE id = auth.uid() 
                    AND organization_id IS NOT NULL
                )
            )
        )
    );

-- Policy for viewing messages
-- Users can only view messages on tickets they have access to
CREATE POLICY "Users can view messages on accessible tickets" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = messages.ticket_id
            AND (
                -- Customer can only view their own tickets
                t.customer_id = auth.uid()
                OR
                -- Organization member can view any ticket in their organization
                t.organization_id = (
                    SELECT organization_id 
                    FROM profiles 
                    WHERE id = auth.uid() 
                    AND organization_id IS NOT NULL
                )
            )
        )
    );

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to automatically update updated_at
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for performance
CREATE INDEX messages_ticket_id_idx ON messages(ticket_id);
CREATE INDEX messages_user_id_idx ON messages(user_id);
CREATE INDEX messages_created_at_idx ON messages(created_at);
