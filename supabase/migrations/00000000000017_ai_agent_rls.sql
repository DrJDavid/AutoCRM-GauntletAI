-- Add RLS policies for AI agents
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- AI agents can only be accessed by users in the same organization
CREATE POLICY "AI agents accessible by organization members" ON public.ai_agents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.organization_id = ai_agents.organization_id
            AND p.role IN ('admin', 'agent', 'head_admin')
        )
    );

-- Add organization_id to ai_conversations for proper RLS
ALTER TABLE public.ai_conversations
    ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Update existing conversations with organization_id from their tickets
UPDATE public.ai_conversations ac
SET organization_id = t.organization_id
FROM public.tickets t
WHERE t.id = ac.ticket_id
AND ac.organization_id IS NULL;

-- Make organization_id required for future entries
ALTER TABLE public.ai_conversations
    ALTER COLUMN organization_id SET NOT NULL;

-- Update ai_conversations RLS
DROP POLICY IF EXISTS "AI conversations visible to ticket participants" ON public.ai_conversations;
CREATE POLICY "AI conversations organization and role check" ON public.ai_conversations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.tickets t
            JOIN public.profiles p ON p.id = auth.uid()
            WHERE t.id = ai_conversations.ticket_id
            AND t.organization_id = ai_conversations.organization_id
            AND p.organization_id = ai_conversations.organization_id
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

-- Update ai_messages RLS
DROP POLICY IF EXISTS "AI messages visible to ticket participants" ON public.ai_messages;
CREATE POLICY "AI messages organization and role check" ON public.ai_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations ac
            JOIN public.tickets t ON t.id = ac.ticket_id
            JOIN public.profiles p ON p.id = auth.uid()
            WHERE ac.id = ai_messages.conversation_id
            AND p.organization_id = ac.organization_id
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

-- Add trigger to automatically set organization_id on ai_conversations
CREATE OR REPLACE FUNCTION public.set_ai_conversation_organization_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.organization_id := (
        SELECT organization_id 
        FROM public.tickets 
        WHERE id = NEW.ticket_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_ai_conversation_organization_id ON public.ai_conversations;
CREATE TRIGGER set_ai_conversation_organization_id
    BEFORE INSERT ON public.ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_ai_conversation_organization_id();

-- Add comment explaining the RLS setup
COMMENT ON TABLE public.ai_agents IS 'AI agents with organization-scoped access control';
COMMENT ON TABLE public.ai_conversations IS 'AI conversations with organization and role-based access control';
COMMENT ON TABLE public.ai_messages IS 'AI messages with inherited organization and role-based access control from conversations'; 