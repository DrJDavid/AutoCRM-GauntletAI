-- Create enum for message types
CREATE TYPE public.message_type AS ENUM ('user', 'ai_response', 'system');

-- Add message_type column to ticket_messages with a default value
ALTER TABLE public.ticket_messages 
ADD COLUMN IF NOT EXISTS message_type message_type DEFAULT 'user'::message_type;

-- Update existing AI messages
UPDATE public.ticket_messages
SET message_type = 'ai_response'::message_type
WHERE metadata->>'ai_generated' = 'true'
   OR metadata->>'type' = 'ai_response';

-- Add RLS policies for AI messages
CREATE POLICY "AI agents can create messages"
  ON public.ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_agents 
      WHERE ai_agents.id = ticket_messages.sender_id
      AND ai_agents.organization_id = (auth.jwt() ->> 'organization_id')::uuid
    )
  ); 