-- Functions for AutoCRM
-- This migration contains all database functions as of 2024-01-24

-- Ticket Management Functions
CREATE OR REPLACE FUNCTION add_ticket_message(
    ticket_id UUID,
    message_content TEXT,
    is_internal BOOLEAN DEFAULT false
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_message_id UUID;
BEGIN
    -- Verify user has access to the ticket
    IF NOT EXISTS (
        SELECT 1 FROM tickets t
        WHERE t.id = ticket_id
        AND (
            t.customer_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND organization_id = t.organization_id
                AND role IN ('admin', 'agent')
            )
        )
    ) THEN
        RAISE EXCEPTION 'Access denied to ticket';
    END IF;

    INSERT INTO ticket_messages (ticket_id, author_id, content, is_internal)
    VALUES (ticket_id, auth.uid(), message_content, is_internal)
    RETURNING id INTO new_message_id;

    RETURN new_message_id;
END;
$$;

CREATE OR REPLACE FUNCTION assign_ticket(
    ticket_id UUID,
    agent_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify user has admin/agent access
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'agent')
    ) THEN
        RAISE EXCEPTION 'Only admins and agents can assign tickets';
    END IF;

    -- Verify agent exists and is in same organization
    IF NOT EXISTS (
        SELECT 1 FROM profiles p
        JOIN tickets t ON t.organization_id = p.organization_id
        WHERE p.id = agent_id
        AND t.id = ticket_id
        AND p.role IN ('admin', 'agent')
    ) THEN
        RAISE EXCEPTION 'Invalid agent assignment';
    END IF;

    UPDATE tickets
    SET assigned_agent_id = agent_id,
        updated_at = NOW()
    WHERE id = ticket_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_ticket_status(
    ticket_id UUID,
    new_status TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify user has access to update the ticket
    IF NOT EXISTS (
        SELECT 1 FROM tickets t
        WHERE t.id = ticket_id
        AND (
            t.customer_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND organization_id = t.organization_id
                AND role IN ('admin', 'agent')
            )
        )
    ) THEN
        RAISE EXCEPTION 'Access denied to update ticket status';
    END IF;

    -- Validate status
    IF new_status NOT IN ('open', 'in_progress', 'resolved', 'closed') THEN
        RAISE EXCEPTION 'Invalid ticket status';
    END IF;

    UPDATE tickets
    SET status = new_status,
        updated_at = NOW()
    WHERE id = ticket_id;
END;
$$;

CREATE OR REPLACE FUNCTION calculate_ticket_sla_status(
    created_at TIMESTAMPTZ,
    priority TEXT,
    status TEXT
) RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    sla_hours INTEGER;
    elapsed_hours FLOAT;
BEGIN
    -- Define SLA hours based on priority
    sla_hours := CASE priority
        WHEN 'urgent' THEN 2
        WHEN 'high' THEN 8
        WHEN 'medium' THEN 24
        WHEN 'low' THEN 48
        ELSE 24
    END;

    -- Skip closed/resolved tickets
    IF status IN ('closed', 'resolved') THEN
        RETURN 'completed';
    END IF;

    -- Calculate elapsed hours
    elapsed_hours := EXTRACT(EPOCH FROM (NOW() - created_at))/3600;

    -- Determine SLA status
    RETURN CASE
        WHEN elapsed_hours <= sla_hours * 0.5 THEN 'on_track'
        WHEN elapsed_hours <= sla_hours * 0.8 THEN 'at_risk'
        ELSE 'breached'
    END;
END;
$$;

CREATE OR REPLACE FUNCTION get_ticket_summary(
    ticket_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'ticket', jsonb_build_object(
            'id', t.id,
            'title', t.title,
            'status', t.status,
            'priority', t.priority,
            'created_at', t.created_at,
            'updated_at', t.updated_at,
            'sla_status', calculate_ticket_sla_status(t.created_at, t.priority, t.status)
        ),
        'customer', jsonb_build_object(
            'id', c.id,
            'name', c.full_name,
            'email', c.email
        ),
        'agent', CASE 
            WHEN a.id IS NOT NULL THEN jsonb_build_object(
                'id', a.id,
                'name', a.full_name,
                'email', a.email
            )
            ELSE NULL
        END,
        'stats', jsonb_build_object(
            'message_count', (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id),
            'attachment_count', (SELECT COUNT(*) FROM attachments WHERE ticket_id = t.id)
        )
    ) INTO result
    FROM tickets t
    JOIN profiles c ON t.customer_id = c.id
    LEFT JOIN profiles a ON t.assigned_agent_id = a.id
    WHERE t.id = ticket_id;

    RETURN result;
END;
$$;

-- Invite System Functions
CREATE OR REPLACE FUNCTION is_test_email(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN email LIKE '%@example.com' 
        OR email LIKE '%@test.com'
        OR email LIKE 'test+%';
END;
$$;

CREATE OR REPLACE FUNCTION create_invite(
    org_id UUID,
    email TEXT,
    invite_type TEXT,
    message TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_invite_id UUID;
    expires TIMESTAMPTZ;
BEGIN
    -- Verify user has admin access to organization
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND organization_id = org_id
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only organization admins can create invites';
    END IF;

    -- Set expiration (24 hours from now)
    expires := NOW() + INTERVAL '24 hours';

    -- Create invite based on type
    IF invite_type = 'agent' THEN
        INSERT INTO agent_organization_invites (organization_id, email, token, expires_at)
        VALUES (org_id, email, gen_random_uuid()::text, expires)
        RETURNING id INTO new_invite_id;
    ELSIF invite_type = 'customer' THEN
        INSERT INTO customer_organization_invites (organization_id, email, token, expires_at)
        VALUES (org_id, email, gen_random_uuid()::text, expires)
        RETURNING id INTO new_invite_id;
    ELSE
        RAISE EXCEPTION 'Invalid invite type';
    END IF;

    RETURN new_invite_id;
END;
$$;

CREATE OR REPLACE FUNCTION validate_invite_token(
    token_param TEXT,
    type_param TEXT
) RETURNS TABLE (
    is_valid BOOLEAN,
    organization_id UUID,
    email TEXT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF type_param = 'agent' THEN
        RETURN QUERY
        SELECT 
            CASE 
                WHEN i.id IS NULL THEN false
                WHEN i.accepted = true THEN false
                WHEN i.expires_at < NOW() THEN false
                ELSE true
            END as is_valid,
            i.organization_id,
            i.email,
            CASE 
                WHEN i.id IS NULL THEN 'Invalid token'
                WHEN i.accepted = true THEN 'Invite already accepted'
                WHEN i.expires_at < NOW() THEN 'Invite expired'
                ELSE ''
            END as error_message
        FROM agent_organization_invites i
        WHERE i.token = token_param;
    ELSIF type_param = 'customer' THEN
        RETURN QUERY
        SELECT 
            CASE 
                WHEN i.id IS NULL THEN false
                WHEN i.accepted = true THEN false
                WHEN i.expires_at < NOW() THEN false
                ELSE true
            END as is_valid,
            i.organization_id,
            i.email,
            CASE 
                WHEN i.id IS NULL THEN 'Invalid token'
                WHEN i.accepted = true THEN 'Invite already accepted'
                WHEN i.expires_at < NOW() THEN 'Invite expired'
                ELSE ''
            END as error_message
        FROM customer_organization_invites i
        WHERE i.token = token_param;
    ELSE
        RETURN QUERY
        SELECT 
            false,
            NULL::UUID,
            NULL::TEXT,
            'Invalid invite type'::TEXT;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION validate_invite_by_email(
    email_param TEXT,
    type_param TEXT
) RETURNS TABLE (
    is_valid BOOLEAN,
    organization_id UUID,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF type_param = 'agent' THEN
        RETURN QUERY
        SELECT 
            CASE 
                WHEN i.id IS NULL THEN false
                WHEN i.accepted = true THEN false
                WHEN i.expires_at < NOW() THEN false
                ELSE true
            END as is_valid,
            i.organization_id,
            CASE 
                WHEN i.id IS NULL THEN 'No invite found'
                WHEN i.accepted = true THEN 'Invite already accepted'
                WHEN i.expires_at < NOW() THEN 'Invite expired'
                ELSE ''
            END as error_message
        FROM agent_organization_invites i
        WHERE i.email = email_param
        AND i.expires_at >= NOW()
        AND i.accepted = false
        ORDER BY i.created_at DESC
        LIMIT 1;
    ELSIF type_param = 'customer' THEN
        RETURN QUERY
        SELECT 
            CASE 
                WHEN i.id IS NULL THEN false
                WHEN i.accepted = true THEN false
                WHEN i.expires_at < NOW() THEN false
                ELSE true
            END as is_valid,
            i.organization_id,
            CASE 
                WHEN i.id IS NULL THEN 'No invite found'
                WHEN i.accepted = true THEN 'Invite already accepted'
                WHEN i.expires_at < NOW() THEN 'Invite expired'
                ELSE ''
            END as error_message
        FROM customer_organization_invites i
        WHERE i.email = email_param
        AND i.expires_at >= NOW()
        AND i.accepted = false
        ORDER BY i.created_at DESC
        LIMIT 1;
    ELSE
        RETURN QUERY
        SELECT 
            false,
            NULL::UUID,
            'Invalid invite type'::TEXT;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION accept_agent_invite(
    invite_token TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Get and validate invite
    SELECT i.* INTO invite_record
    FROM agent_organization_invites i
    WHERE i.token = invite_token
    AND i.expires_at >= NOW()
    AND i.accepted = false;

    IF invite_record.id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invite';
    END IF;

    -- Update user's profile
    UPDATE profiles
    SET organization_id = invite_record.organization_id,
        role = 'agent'
    WHERE id = auth.uid()
    AND email = invite_record.email;

    -- Mark invite as accepted
    UPDATE agent_organization_invites
    SET accepted = true
    WHERE id = invite_record.id;
END;
$$;

CREATE OR REPLACE FUNCTION accept_customer_invite(
    invite_token TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Get and validate invite
    SELECT i.* INTO invite_record
    FROM customer_organization_invites i
    WHERE i.token = invite_token
    AND i.expires_at >= NOW()
    AND i.accepted = false;

    IF invite_record.id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invite';
    END IF;

    -- Create customer organization relationship
    INSERT INTO customer_organizations (customer_id, organization_id)
    VALUES (auth.uid(), invite_record.organization_id);

    -- Mark invite as accepted
    UPDATE customer_organization_invites
    SET accepted = true
    WHERE id = invite_record.id;
END;
$$;

-- Test Helper Functions (for development only)
CREATE OR REPLACE FUNCTION generate_test_invite(
    org_id UUID,
    email TEXT DEFAULT 'test@example.com',
    invite_type TEXT DEFAULT 'customer'
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token TEXT;
BEGIN
    IF NOT is_test_email(email) THEN
        RAISE EXCEPTION 'Can only generate test invites for test emails';
    END IF;

    token := gen_random_uuid()::text;

    IF invite_type = 'agent' THEN
        INSERT INTO agent_organization_invites (organization_id, email, token, expires_at)
        VALUES (org_id, email, token, NOW() + INTERVAL '24 hours');
    ELSIF invite_type = 'customer' THEN
        INSERT INTO customer_organization_invites (organization_id, email, token, expires_at)
        VALUES (org_id, email, token, NOW() + INTERVAL '24 hours');
    ELSE
        RAISE EXCEPTION 'Invalid invite type';
    END IF;

    RETURN token;
END;
$$;
