-- Add role-based ticket status permissions
-- migrate:up
BEGIN;

-- Create schema_version table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_version (
    version text PRIMARY KEY,
    description text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Record this migration
INSERT INTO schema_version (version, description)
VALUES ('20240124_ticket_status_permissions', 'Add role-based ticket status permissions')
ON CONFLICT (version) DO NOTHING;

-- Create an enum for ticket status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Function to validate ticket status changes based on user role
CREATE OR REPLACE FUNCTION check_ticket_status_change()
RETURNS TRIGGER AS $$
DECLARE
    user_role text;
    old_status text;
BEGIN
    -- Get the user's role
    SELECT role INTO user_role
    FROM profiles
    WHERE id = auth.uid();

    -- Get the old status
    SELECT status::text INTO old_status
    FROM tickets
    WHERE id = NEW.id;

    -- For customers: can only open new tickets or close their own tickets
    IF user_role = 'customer' THEN
        IF OLD.status IS NULL AND NEW.status = 'open' THEN
            -- Allow customers to create new open tickets
            RETURN NEW;
        ELSIF OLD.status = 'open' AND NEW.status = 'closed' THEN
            -- Allow customers to close their own open tickets
            IF OLD.customer_id = auth.uid() THEN
                RETURN NEW;
            END IF;
        END IF;
        RAISE EXCEPTION 'Customers can only open new tickets or close their own open tickets';
    
    -- For agents and admins: can change to any status
    ELSIF user_role IN ('agent', 'admin') THEN
        -- Ensure the ticket belongs to their organization
        IF EXISTS (
            SELECT 1 FROM tickets t
            JOIN profiles p ON p.organization_id = t.organization_id
            WHERE t.id = NEW.id
            AND p.id = auth.uid()
        ) THEN
            RETURN NEW;
        END IF;
        RAISE EXCEPTION 'Agents can only modify tickets within their organization';
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for ticket status changes
DROP TRIGGER IF EXISTS check_ticket_status_trigger ON tickets;
CREATE TRIGGER check_ticket_status_trigger
    BEFORE UPDATE OF status
    ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION check_ticket_status_change();

-- Update ticket_messages table to ensure author_id is set
CREATE OR REPLACE FUNCTION create_ticket_status_message()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO ticket_messages (
            ticket_id,
            author_id,
            content,
            is_internal,
            metadata,
            created_at
        ) VALUES (
            NEW.id,
            auth.uid(),
            format('Status changed from %s to %s', OLD.status, NEW.status),
            true,
            jsonb_build_object('change_type', 'status_change'),
            now()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic message creation
DROP TRIGGER IF EXISTS create_ticket_status_message_trigger ON tickets;
CREATE TRIGGER create_ticket_status_message_trigger
    AFTER UPDATE OF status
    ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION create_ticket_status_message();

COMMIT;

-- migrate:down
BEGIN;
    DROP TRIGGER IF EXISTS check_ticket_status_trigger ON tickets;
    DROP FUNCTION IF EXISTS check_ticket_status_change();
    DROP TRIGGER IF EXISTS create_ticket_status_message_trigger ON tickets;
    DROP FUNCTION IF EXISTS create_ticket_status_message();
    DROP TYPE IF EXISTS ticket_status;
    DROP TABLE IF EXISTS schema_version;
END;
