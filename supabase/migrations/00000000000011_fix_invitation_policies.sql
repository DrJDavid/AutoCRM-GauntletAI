-- Drop existing policies if they exist
drop policy if exists "Users can view their own invitations" on invitations;

-- Add policy to allow users to view invitations for their email
create policy "Users can view their own invitations"
  on invitations for select
  to public
  using (
    email = coalesce(
      (select email from auth.users where id = auth.uid()),
      current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Ensure RLS is enabled
alter table invitations enable row level security; 