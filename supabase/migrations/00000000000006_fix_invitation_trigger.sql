-- Drop the recursive trigger
drop trigger if exists trigger_expire_invitations on invitations;

-- Create a better version that only triggers on insert
create or replace function expire_invitations() returns trigger as $$
begin
  -- Only update other rows, not the one that triggered this
  update invitations
  set status = 'expired'
  where id != NEW.id  -- Prevent recursion
  and expires_at < now()
  and status = 'pending';
  return NEW;
end;
$$ language plpgsql;

-- Recreate trigger for insert only
create trigger trigger_expire_invitations
  after insert on invitations
  for each row
  execute function expire_invitations(); 