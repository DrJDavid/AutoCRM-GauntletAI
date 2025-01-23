-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    role TEXT NOT NULL CHECK (role IN ('admin', 'agent', 'customer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for viewing profiles
-- Users can view:
-- 1. Their own profile
-- 2. Profiles in their organization
-- 3. Profiles related to their tickets (for customers)
CREATE POLICY "Users can view accessible profiles" ON profiles
    FOR SELECT USING (
        -- Users can view their own profile
        auth.uid() = id
        OR
        -- Users can view profiles in their organization
        (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        ) = organization_id
        OR
        -- Customers can view profiles related to their tickets
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.customer_id = auth.uid()
            AND (
                t.assigned_agent_id = profiles.id
                OR
                EXISTS (
                    SELECT 1 FROM messages m
                    WHERE m.ticket_id = t.id
                    AND m.user_id = profiles.id
                )
            )
        )
    );

-- Function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, organization_id, role)
    VALUES (
        NEW.id,
        NEW.email,
        (NEW.raw_user_meta_data->>'organization_id')::uuid,
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    );
    RETURN NEW;
END;
$$ language plpgsql security definer;

-- Trigger to create profile on user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX profiles_organization_id_idx ON profiles(organization_id);
CREATE INDEX profiles_email_idx ON profiles(email);
