-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view organization members" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Temporarily disable RLS to check if that's the issue
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Create a single simple policy for testing
CREATE POLICY "Allow all operations for authenticated users"
    ON users
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Add a basic policy for public access to certain fields
CREATE POLICY "Allow public read access to basic user info"
    ON users
    FOR SELECT
    USING (true);
