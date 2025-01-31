-- Copy existing internal notes to the new table
INSERT INTO public.ticket_internal_notes (ticket_id, author_id, content, created_at, updated_at)
SELECT 
    ticket_id,
    sender_id as author_id,
    message as content,
    created_at,
    updated_at
FROM public.ticket_messages
WHERE is_internal = true;

-- Now we can safely remove the is_internal column and its data from ticket_messages
-- But let's keep it for now as a backup until we confirm everything works
-- ALTER TABLE public.ticket_messages DROP COLUMN is_internal; 