-- Add category enum type
DO $$ BEGIN
    CREATE TYPE ticket_category AS ENUM ('account', 'billing', 'technical_issue', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add category column to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS category ticket_category NOT NULL DEFAULT 'other';

-- Add comment for documentation
COMMENT ON COLUMN tickets.category IS 'Category of the ticket (account, billing, technical_issue, other)';
