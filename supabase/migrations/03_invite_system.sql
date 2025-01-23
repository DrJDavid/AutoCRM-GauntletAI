-- Invite System SQL Functions and Policies
-- Description: This file contains all the SQL functions and policies related to the invite system

-- Function to accept an agent invite
CREATE OR REPLACE FUNCTION accept_agent_invite(invite_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invite_id UUID;
    v_org_id UUID;
    v_email TEXT;
    v_user_id UUID;
BEGIN
    -- Get invite details
    SELECT id, organization_id, email
    INTO v_invite_id, v_org_id, v_email
    FROM agent_organization_invites
    WHERE token = invite_token
    AND accepted = false
    AND expires_at > NOW();

    IF v_invite_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invite';
    END IF;

    -- Get user ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User account not found';
    END IF;

    -- Create profile
    INSERT INTO profiles (id, email, role, organization_id)
    VALUES (v_user_id, v_email, 'agent', v_org_id);

    -- Mark invite as accepted
    UPDATE agent_organization_invites
    SET accepted = true
    WHERE id = v_invite_id;
END;
$$;

-- Function to accept a customer invite
CREATE OR REPLACE FUNCTION accept_customer_invite(invite_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invite_id UUID;
    v_org_id UUID;
    v_email TEXT;
    v_user_id UUID;
BEGIN
    -- Get invite details
    SELECT id, organization_id, email
    INTO v_invite_id, v_org_id, v_email
    FROM customer_organization_invites
    WHERE token = invite_token
    AND accepted = false
    AND expires_at > NOW();

    IF v_invite_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invite';
    END IF;

    -- Get user ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User account not found';
    END IF;

    -- Create profile
    INSERT INTO profiles (id, email, role, organization_id)
    VALUES (v_user_id, v_email, 'customer', v_org_id);

    -- Mark invite as accepted
    UPDATE customer_organization_invites
    SET accepted = true
    WHERE id = v_invite_id;
END;
$$;

-- Function to check if an email is a test email
CREATE OR REPLACE FUNCTION is_test_email(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN email LIKE '%@example.com' 
           OR email LIKE '%@test.com'
           OR email LIKE 'test+%@%';
END;
$$;

-- RLS Policies for Test Emails
ALTER TABLE profiles
    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow test emails to bypass verification"
    ON profiles
    FOR ALL
    TO authenticated
    USING (
        is_test_email(email) 
        OR (auth.jwt() ->> 'email_verified')::boolean = true
    );

-- Helper function to generate a test invite
CREATE OR REPLACE FUNCTION generate_test_invite(
    org_id UUID,
    email TEXT DEFAULT 'test@example.com',
    invite_type TEXT DEFAULT 'agent'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_token TEXT;
BEGIN
    -- Generate a random token
    v_token := encode(gen_random_bytes(32), 'hex');
    
    -- Create the invite based on type
    IF invite_type = 'agent' THEN
        INSERT INTO agent_organization_invites (
            organization_id,
            email,
            token,
            expires_at
        ) VALUES (
            org_id,
            email,
            v_token,
            NOW() + INTERVAL '7 days'
        );
    ELSIF invite_type = 'customer' THEN
        INSERT INTO customer_organization_invites (
            organization_id,
            email,
            token,
            expires_at
        ) VALUES (
            org_id,
            email,
            v_token,
            NOW() + INTERVAL '7 days'
        );
    ELSE
        RAISE EXCEPTION 'Invalid invite type. Must be either "agent" or "customer"';
    END IF;
    
    RETURN v_token;
END;
$$;
