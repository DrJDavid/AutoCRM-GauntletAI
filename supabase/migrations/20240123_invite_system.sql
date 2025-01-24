-- Migration: Invite System
-- Description: Creates tables and functions for managing agent and customer invites
-- Author: David
-- Date: 2024-01-23

-- Create invite tables with proper structure and constraints
CREATE TABLE IF NOT EXISTS public.agent_organization_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token UUID DEFAULT gen_random_uuid() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted BOOLEAN DEFAULT false NOT NULL,
    UNIQUE(organization_id, email)
);

CREATE TABLE IF NOT EXISTS public.customer_organization_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token UUID DEFAULT gen_random_uuid() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted BOOLEAN DEFAULT false NOT NULL,
    UNIQUE(organization_id, email)
);

-- Create RPC function for invite creation
-- This function handles both agent and customer invites
-- It generates a unique token and sets appropriate expiry dates
CREATE OR REPLACE FUNCTION public.create_invite(
    org_id UUID,
    email TEXT,
    invite_type TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_token UUID;
    expiry_date TIMESTAMPTZ;
BEGIN
    -- Generate a new token
    new_token := gen_random_uuid();
    
    -- Set expiry date based on invite type
    -- Agents get 7 days, customers get 30 days
    IF invite_type = 'agent' THEN
        expiry_date := now() + INTERVAL '7 days';
    ELSE
        expiry_date := now() + INTERVAL '30 days';
    END IF;

    -- Insert the invite based on type
    IF invite_type = 'agent' THEN
        INSERT INTO public.agent_organization_invites (
            organization_id,
            email,
            token,
            expires_at
        ) VALUES (
            org_id,
            email,
            new_token,
            expiry_date
        );
    ELSE
        INSERT INTO public.customer_organization_invites (
            organization_id,
            email,
            token,
            expires_at
        ) VALUES (
            org_id,
            email,
            new_token,
            expiry_date
        );
    END IF;

    RETURN new_token;
END;
$$;

-- Enable Row Level Security
ALTER TABLE public.agent_organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_organization_invites ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DO $$ 
BEGIN
    -- Drop agent invite policies
    DROP POLICY IF EXISTS "Organization admins can create agent invites" ON public.agent_organization_invites;
    DROP POLICY IF EXISTS "Organization members can view agent invites" ON public.agent_organization_invites;
    DROP POLICY IF EXISTS "Organization admins can delete agent invites" ON public.agent_organization_invites;
    DROP POLICY IF EXISTS "Public can view agent invites by token" ON public.agent_organization_invites;
    
    -- Drop customer invite policies
    DROP POLICY IF EXISTS "Organization members can create customer invites" ON public.customer_organization_invites;
    DROP POLICY IF EXISTS "Organization members can view customer invites" ON public.customer_organization_invites;
    DROP POLICY IF EXISTS "Organization members can delete customer invites" ON public.customer_organization_invites;
    DROP POLICY IF EXISTS "Public can view customer invites by token" ON public.customer_organization_invites;
END $$;

-- Enable RLS and grant access
ALTER TABLE public.agent_organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_organization_invites ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.agent_organization_invites TO anon;
GRANT SELECT ON public.customer_organization_invites TO anon;

-- Create agent invite policies
CREATE POLICY "Organization admins can create agent invites"
    ON public.agent_organization_invites
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.organization_id = agent_organization_invites.organization_id
            AND profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Organization members can view agent invites"
    ON public.agent_organization_invites
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.organization_id = agent_organization_invites.organization_id
            AND profiles.id = auth.uid()
        )
    );

CREATE POLICY "Organization admins can delete agent invites"
    ON public.agent_organization_invites
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.organization_id = agent_organization_invites.organization_id
            AND profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Public can view agent invites by token"
    ON public.agent_organization_invites
    FOR SELECT
    TO public
    USING (true);  -- We'll handle validation in the function

-- Create customer invite policies
CREATE POLICY "Organization members can create customer invites"
    ON public.customer_organization_invites
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.organization_id = customer_organization_invites.organization_id
            AND profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'agent')
        )
    );

CREATE POLICY "Organization members can view customer invites"
    ON public.customer_organization_invites
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.organization_id = customer_organization_invites.organization_id
            AND profiles.id = auth.uid()
        )
    );

CREATE POLICY "Organization members can delete customer invites"
    ON public.customer_organization_invites
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.organization_id = customer_organization_invites.organization_id
            AND profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'agent')
        )
    );

CREATE POLICY "Public can view customer invites by token"
    ON public.customer_organization_invites
    FOR SELECT
    TO public
    USING (true);  -- We'll handle validation in the function

-- Add function to validate invite token with logging
CREATE OR REPLACE FUNCTION public.validate_invite_token(token_param UUID, type_param TEXT)
RETURNS TABLE (
    is_valid BOOLEAN,
    organization_id UUID,
    email TEXT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Log input parameters
    RAISE NOTICE 'Validating token: %, type: %', token_param, type_param;

    -- Check agent invites
    IF type_param = 'agent' THEN
        SELECT *
        INTO invite_record
        FROM public.agent_organization_invites
        WHERE token = token_param
        AND expires_at > now()
        AND accepted = false;

        -- Log agent invite query results
        RAISE NOTICE 'Agent invite query result: %', invite_record;
    
    -- Check customer invites
    ELSIF type_param = 'customer' THEN
        SELECT *
        INTO invite_record
        FROM public.customer_organization_invites
        WHERE token = token_param
        AND expires_at > now()
        AND accepted = false;

        -- Log customer invite query results
        RAISE NOTICE 'Customer invite query result: %', invite_record;
    
    ELSE
        RAISE NOTICE 'Invalid invite type: %', type_param;
        RETURN QUERY SELECT 
            false,
            NULL::UUID,
            NULL::TEXT,
            'Invalid invite type'::TEXT;
        RETURN;
    END IF;

    -- Return results with logging
    IF invite_record IS NULL THEN
        RAISE NOTICE 'No valid invite found';
        RETURN QUERY SELECT 
            false,
            NULL::UUID,
            NULL::TEXT,
            'Invalid or expired invitation'::TEXT;
    ELSE
        RAISE NOTICE 'Valid invite found: %', invite_record;
        RETURN QUERY SELECT 
            true,
            invite_record.organization_id,
            invite_record.email,
            NULL::TEXT;
    END IF;
END;
$$;
