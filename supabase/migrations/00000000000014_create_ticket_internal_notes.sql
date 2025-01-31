-- Create the ticket_internal_notes table
CREATE TABLE IF NOT EXISTS public.ticket_internal_notes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id),
    content text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.ticket_internal_notes ENABLE ROW LEVEL SECURITY;

-- Only team members can view internal notes
CREATE POLICY "Team members can view internal notes" ON public.ticket_internal_notes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'agent', 'head_admin')
        )
    );

-- Only team members can create internal notes
CREATE POLICY "Team members can create internal notes" ON public.ticket_internal_notes
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'agent', 'head_admin')
        )
    );

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_internal_notes;

-- Grant access to authenticated users
GRANT ALL ON public.ticket_internal_notes TO authenticated;

-- Add updated_at trigger
CREATE TRIGGER update_ticket_internal_notes_updated_at
    BEFORE UPDATE ON public.ticket_internal_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); 