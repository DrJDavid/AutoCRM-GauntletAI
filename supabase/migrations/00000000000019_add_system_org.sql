-- Add is_system column if it doesn't exist
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false;

-- Insert system organization if it doesn't exist
INSERT INTO organizations (
  name,
  slug,
  is_system,
  settings,
  metadata
)
VALUES (
  'System',
  'system',
  true,
  jsonb_build_object(
    'supportEmail', 'support@autocrm.com',
    'timezone', 'UTC'
  ),
  '{}'::jsonb
)
ON CONFLICT (slug) DO UPDATE
SET
  is_system = true,
  updated_at = NOW(); 