-- Create invitation_status enum
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    email TEXT NOT NULL,
    role user_role NOT NULL,
    status invitation_status DEFAULT 'pending',
    invited_by UUID NOT NULL REFERENCES public.profiles(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    
    -- Each email can only have one active invitation per organization
    UNIQUE (organization_id, email, status)
);

-- Add RLS policies
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Allow organization admins and head_admins to create invitations
CREATE POLICY "Allow admins to create invitations" ON public.invitations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = organization_id
            AND (profiles.role = 'admin' OR profiles.role = 'head_admin')
            AND profiles.is_deleted IS NOT TRUE
        )
    );

-- Allow organization admins and head_admins to update invitations
CREATE POLICY "Allow admins to update invitations" ON public.invitations
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = organization_id
            AND (profiles.role = 'admin' OR profiles.role = 'head_admin')
            AND profiles.is_deleted IS NOT TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = organization_id
            AND (profiles.role = 'admin' OR profiles.role = 'head_admin')
            AND profiles.is_deleted IS NOT TRUE
        )
    );

-- Allow users to view invitations sent to their email
CREATE POLICY "Allow users to view their invitations" ON public.invitations
    FOR SELECT
    TO authenticated
    USING (
        email = (
            SELECT email FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_deleted IS NOT TRUE
        )
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = organization_id
            AND (profiles.role = 'admin' OR profiles.role = 'head_admin')
            AND profiles.is_deleted IS NOT TRUE
        )
    );

-- Create function to handle invitation acceptance
CREATE OR REPLACE FUNCTION public.accept_invitation(
    invitation_id UUID,
    user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation invitations;
    v_user_email text;
BEGIN
    -- Get user's email
    SELECT email INTO v_user_email
    FROM profiles
    WHERE id = user_id;

    -- Get and validate invitation
    SELECT * INTO v_invitation
    FROM invitations
    WHERE id = invitation_id
    AND status = 'pending'
    AND expires_at > NOW()
    AND is_deleted IS NOT TRUE;

    IF v_invitation IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invitation';
    END IF;

    -- Verify email matches
    IF v_invitation.email != v_user_email THEN
        RAISE EXCEPTION 'Invitation email does not match user email';
    END IF;

    -- Update invitation status
    UPDATE invitations
    SET status = 'accepted',
        updated_at = NOW()
    WHERE id = invitation_id;

    -- Update or create user profile
    INSERT INTO profiles (id, email, organization_id, role)
    VALUES (user_id, v_user_email, v_invitation.organization_id, v_invitation.role)
    ON CONFLICT (id) DO UPDATE
    SET organization_id = v_invitation.organization_id,
        role = v_invitation.role,
        updated_at = NOW();
END;
$$;

-- Create function to send invitation
CREATE OR REPLACE FUNCTION public.send_invitation(
    org_id UUID,
    target_email text,
    target_role user_role
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation_id UUID;
BEGIN
    -- Verify sender has permission
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND organization_id = org_id
        AND (role = 'admin' OR role = 'head_admin')
        AND is_deleted IS NOT TRUE
    ) THEN
        RAISE EXCEPTION 'Unauthorized to send invitations';
    END IF;

    -- Create invitation
    INSERT INTO invitations (
        organization_id,
        email,
        role,
        invited_by
    )
    VALUES (
        org_id,
        target_email,
        target_role,
        auth.uid()
    )
    RETURNING id INTO v_invitation_id;

    RETURN v_invitation_id;
END;
$$;

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invitations_updated_at
    BEFORE UPDATE ON public.invitations
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
