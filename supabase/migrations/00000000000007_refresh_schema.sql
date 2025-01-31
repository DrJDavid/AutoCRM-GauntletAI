-- Drop and recreate the function to ensure it's in the schema cache
drop function if exists validate_invite_by_email(text, invitation_type);

create or replace function validate_invite_by_email(
  email_param text,
  type_param invitation_type
)
returns table (
  organization_id uuid,
  role user_role,
  is_valid boolean
) as $$
begin
  return query
  select
    i.organization_id,
    i.role,
    (i.status = 'pending' and i.expires_at > now()) as is_valid
  from invitations i
  where i.email = email_param
    and i.type = type_param
    and i.status = 'pending'
    and i.expires_at > now()
  limit 1;
end;
$$ language plpgsql security definer;

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant execute on function public.validate_invite_by_email(text, invitation_type) to anon, authenticated;
grant execute on function public.accept_invitation(text, uuid) to anon, authenticated; 