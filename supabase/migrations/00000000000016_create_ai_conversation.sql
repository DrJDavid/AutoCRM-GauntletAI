-- Create an enum for AI message types if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.ai_message_type AS ENUM ('chat', 'internal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new fields to existing ai_agents table
ALTER TABLE public.ai_agents
    ADD COLUMN IF NOT EXISTS api_key text,
    ADD COLUMN IF NOT EXISTS model text,
    ADD COLUMN IF NOT EXISTS temperature numeric DEFAULT 0.7,
    ADD COLUMN IF NOT EXISTS max_tokens integer DEFAULT 1000;

-- Create a table for AI conversation contexts
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    agent_id uuid REFERENCES public.ai_agents(id),
    type public.ai_message_type NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    -- Add any additional context fields we might need
    summary text,
    last_context_window text,
    UNIQUE(ticket_id, type)
);

-- Create a table for AI messages
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    -- Link to the original message that triggered this AI message (if any)
    source_message_id uuid,
    -- Can reference either ticket_messages or ticket_internal_notes
    source_message_type text CHECK (source_message_type IN ('chat', 'internal')),
    -- Link to ai_agent_responses for tracking performance
    agent_response_id uuid REFERENCES public.ai_agent_responses(id)
);

-- Add RLS policies
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- AI conversations are visible to ticket participants
CREATE POLICY "AI conversations visible to ticket participants" ON public.ai_conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets t
            LEFT JOIN public.profiles p ON p.id = auth.uid()
            WHERE t.id = ai_conversations.ticket_id
            AND (
                -- Allow access if:
                (ai_conversations.type = 'chat' AND ( -- For chat conversations
                    t.customer_id = auth.uid() OR -- User is the customer
                    t.assigned_to = auth.uid() OR -- User is assigned to ticket
                    p.role IN ('admin', 'agent', 'head_admin') -- User is staff
                ))
                OR
                (ai_conversations.type = 'internal' AND -- For internal conversations
                    p.role IN ('admin', 'agent', 'head_admin') -- User is staff
                )
            )
        )
    );

-- AI messages follow the same visibility rules as conversations
CREATE POLICY "AI messages visible to ticket participants" ON public.ai_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations ac
            JOIN public.tickets t ON t.id = ac.ticket_id
            LEFT JOIN public.profiles p ON p.id = auth.uid()
            WHERE ac.id = ai_messages.conversation_id
            AND (
                (ac.type = 'chat' AND (
                    t.customer_id = auth.uid() OR
                    t.assigned_to = auth.uid() OR
                    p.role IN ('admin', 'agent', 'head_admin')
                ))
                OR
                (ac.type = 'internal' AND
                    p.role IN ('admin', 'agent', 'head_admin')
                )
            )
        )
    );

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;

-- Grant access to authenticated users
GRANT ALL ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_messages TO authenticated;

-- Add updated_at trigger
CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); 