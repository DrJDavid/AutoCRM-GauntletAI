-- Add unique constraint if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_agents_organization_id_name_key'
  ) THEN
    ALTER TABLE ai_agents ADD CONSTRAINT ai_agents_organization_id_name_key UNIQUE (organization_id, name);
  END IF;
END $$;

-- Get the system organization ID
WITH system_org AS (
  SELECT id FROM organizations WHERE is_system = true LIMIT 1
)
-- Insert default AI agent if it doesn't exist
INSERT INTO ai_agents (
  name,
  description,
  is_active,
  organization_id,
  model,
  temperature,
  max_tokens,
  configuration,
  metadata
)
SELECT
  'Support Assistant',
  'General purpose support AI assistant',
  true,
  system_org.id,
  'gpt-3.5-turbo',
  0.7,
  500,
  jsonb_build_object(
    'model', 'gpt-3.5-turbo',
    'temperature', 0.7,
    'max_tokens', 500
  ),
  '{}'::jsonb
FROM system_org
ON CONFLICT (organization_id, name) DO UPDATE
SET
  model = EXCLUDED.model,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  configuration = EXCLUDED.configuration,
  updated_at = NOW(); 