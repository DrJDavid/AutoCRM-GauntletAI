-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a function to handle organization and admin creation in one transaction
CREATE OR REPLACE FUNCTION public.create_organization_with_admin(
  org_name TEXT,
  org_slug TEXT,
  admin_email TEXT,
  admin_password TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Required to allow the function to create auth users
SET search_path = public
AS $$
DECLARE
  org_id UUID;
  user_id UUID;
BEGIN
  -- Start transaction
  BEGIN
    -- Create the organization first
    INSERT INTO public.organizations (
      name,
      slug,
      is_deleted
    ) VALUES (
      org_name,
      org_slug,
      false
    )
    RETURNING id INTO org_id;

    -- Create the auth user using auth.create_user
    SELECT id INTO user_id 
    FROM auth.create_user(
      admin_email,
      admin_password,
      '{}'::jsonb,  -- user_metadata
      '{}'::jsonb,  -- app_metadata
      NULL,         -- phone
      NULL,         -- password_hash
      TRUE,         -- email_confirm
      FALSE,        -- phone_confirm
      NULL,         -- nonce
      NULL,         -- ticket_id
      NULL          -- raw_user_meta_data
    ) AS auth_user;

    -- Create the admin profile
    INSERT INTO public.profiles (
      id,
      email,
      role,
      organization_id,
      is_head_admin,
      is_deleted
    ) VALUES (
      user_id,
      admin_email,
      'head_admin',
      org_id,
      true,
      false
    );

    -- Return the organization ID
    RETURN org_id;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback everything if any step fails
    RAISE EXCEPTION 'Failed to create organization and admin: %', SQLERRM;
  END;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.create_organization_with_admin TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION public.create_organization_with_admin IS 'Creates an organization and its head admin user in one atomic transaction.';
