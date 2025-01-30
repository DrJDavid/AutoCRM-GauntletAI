-- Allow organization creation during signup
create policy "Allow organization creation during signup"
  on organizations for insert
  with check (true);  -- We'll control this via application logic and auth hooks

-- Disable email confirmation requirement by setting confirmed_at during signup
create or replace function auth.handle_new_user()
returns trigger as $$
begin
  -- Auto-confirm email
  new.email_confirmed_at = now();
  
  -- The function must return the new row
  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      before insert on auth.users
      for each row
      execute procedure auth.handle_new_user();
  end if;
end
$$;

-- Note: This is safe because:
-- 1. The application controls organization creation logic
-- 2. Each organization is isolated by RLS after creation 