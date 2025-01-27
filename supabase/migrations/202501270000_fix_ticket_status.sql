-- migrate:up
-- Step 1: Safely add status column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'status'
  ) THEN
    ALTER TABLE tickets ADD COLUMN status TEXT NOT NULL DEFAULT 'open';
  END IF;
END $$;

-- Step 2: Create enum type
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- Step 3: Convert column to enum type
ALTER TABLE tickets
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE ticket_status USING status::text::ticket_status,
  ALTER COLUMN status SET DEFAULT 'open';

-- migrate:down
-- Rollback changes
ALTER TABLE tickets 
  ALTER COLUMN status TYPE TEXT,
  ALTER COLUMN status DROP DEFAULT;

DROP TYPE IF EXISTS ticket_status; 