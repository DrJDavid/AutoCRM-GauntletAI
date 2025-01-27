-- migrate:up
BEGIN;

-- Add policy to allow new organization creation
CREATE POLICY "Allow new organization creation" ON organizations
FOR INSERT WITH CHECK (true);

-- Add policy to allow public to read organizations for signup
CREATE POLICY "Allow public to read organizations" ON organizations
FOR SELECT USING (true);

COMMIT;

-- migrate:down
BEGIN;

DROP POLICY IF EXISTS "Allow new organization creation" ON organizations;
DROP POLICY IF EXISTS "Allow public to read organizations" ON organizations;

COMMIT;
