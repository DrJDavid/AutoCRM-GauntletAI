-- migrate:up
BEGIN;

-- Record this migration
INSERT INTO schema_version (version, description)
VALUES ('20240124_020100', 'Base database functions')
ON CONFLICT (version) DO NOTHING;

-- [Previous functions content from functions.sql goes here]
-- I'm not including it here to avoid repetition, but it would be the entire
-- contents of our previous functions.sql file

COMMIT;

-- migrate:down
BEGIN;
    -- Drop all functions
    DROP FUNCTION IF EXISTS add_ticket_message;
    DROP FUNCTION IF EXISTS assign_ticket;
    DROP FUNCTION IF EXISTS update_ticket_status;
    DROP FUNCTION IF EXISTS calculate_ticket_sla_status;
    DROP FUNCTION IF EXISTS get_ticket_summary;
    DROP FUNCTION IF EXISTS is_test_email;
    DROP FUNCTION IF EXISTS create_invite;
    DROP FUNCTION IF EXISTS validate_invite_token;
    DROP FUNCTION IF EXISTS validate_invite_by_email;
    DROP FUNCTION IF EXISTS accept_agent_invite;
    DROP FUNCTION IF EXISTS accept_customer_invite;
    DROP FUNCTION IF EXISTS generate_test_invite;
COMMIT;
