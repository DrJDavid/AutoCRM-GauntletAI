/*
 * Ticket System Tables
 * ===================
 * This file contains tables related to the ticket management system.
 * Tickets are the core unit of customer support, tracking issues and
 * their resolution.
 */

-- Tickets Table
-- ============
-- Main table for support tickets
CREATE TABLE public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' 
        CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    customer_id UUID REFERENCES profiles NOT NULL,
    assigned_agent_id UUID REFERENCES profiles,
    assigned_team_id UUID REFERENCES teams,
    organization_id UUID REFERENCES organizations NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.tickets IS 'Customer support tickets';
COMMENT ON COLUMN tickets.metadata IS 'Flexible JSON storage for ticket data';

-- Example metadata structure:
/*
{
    "browser": "Chrome 98.0",
    "os": "Windows 11",
    "customFields": {
        "department": "billing",
        "product": "premium"
    },
    "timeTracking": {
        "firstResponseTime": "2024-01-22T14:30:00Z",
        "resolutionTime": "2024-01-22T16:45:00Z"
    }
}
*/

-- Ticket Messages Table
-- ===================
-- Stores all messages/comments on tickets
CREATE TABLE public.ticket_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES tickets NOT NULL,
    author_id UUID REFERENCES profiles NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_internal BOOLEAN DEFAULT false,  -- True for agent-only notes
    metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.ticket_messages IS 'Messages and internal notes on tickets';

-- Agent Performance View
-- ====================
-- Materialized view for agent performance metrics
CREATE VIEW agent_performance AS
SELECT 
    t.assigned_agent_id,
    p.full_name as agent_name,
    COUNT(DISTINCT t.id) as total_tickets,
    COUNT(DISTINCT CASE WHEN t.status = 'resolved' THEN t.id END) as resolved_tickets,
    AVG(
        EXTRACT(EPOCH FROM (
            SELECT MIN(created_at) 
            FROM ticket_messages 
            WHERE ticket_id = t.id 
            AND author_id = t.assigned_agent_id
        ) - t.created_at)
    )::numeric as avg_resolution_time,
    t.organization_id
FROM tickets t
LEFT JOIN profiles p ON t.assigned_agent_id = p.id
WHERE t.assigned_agent_id IS NOT NULL
GROUP BY t.assigned_agent_id, p.full_name, t.organization_id;

COMMENT ON VIEW agent_performance IS 'Real-time agent performance metrics';

-- Indexes
-- =======
CREATE INDEX idx_tickets_customer ON tickets(customer_id);
CREATE INDEX idx_tickets_agent ON tickets(assigned_agent_id);
CREATE INDEX idx_tickets_team ON tickets(assigned_team_id);
CREATE INDEX idx_tickets_organization ON tickets(organization_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_tags ON tickets USING gin(tags);
CREATE INDEX idx_tickets_metadata ON tickets USING gin(metadata jsonb_path_ops);
CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);

-- Row Level Security
-- =================

-- Tickets RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Tickets viewable by organization members and ticket owner
CREATE POLICY "Tickets viewable by organization members and owner" 
    ON tickets FOR SELECT 
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        OR customer_id = auth.uid()
    );

-- Tickets creatable by customers
CREATE POLICY "Tickets creatable by customers" 
    ON tickets FOR INSERT 
    WITH CHECK (
        customer_id = auth.uid()
    );

-- Tickets updatable by agents and admins
CREATE POLICY "Tickets updatable by agents and admins" 
    ON tickets FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND organization_id = tickets.organization_id
            AND role IN ('agent', 'admin')
        )
    );

-- Ticket Messages RLS
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Messages viewable by ticket participants
CREATE POLICY "Messages viewable by ticket participants" 
    ON ticket_messages FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_messages.ticket_id
            AND (
                t.customer_id = auth.uid()
                OR t.assigned_agent_id = auth.uid()
                OR t.organization_id IN (
                    SELECT organization_id FROM profiles 
                    WHERE id = auth.uid()
                )
            )
        )
    );

/*
 * Usage Examples
 * =============
 * 
 * 1. Create a new ticket:
 *    INSERT INTO tickets (
 *        title, description, customer_id, organization_id
 *    ) VALUES (
 *        'Login Issue',
 *        'Cannot login to the dashboard',
 *        'customer-uuid',
 *        'org-uuid'
 *    );
 * 
 * 2. Add a message to a ticket:
 *    INSERT INTO ticket_messages (
 *        ticket_id, author_id, content
 *    ) VALUES (
 *        'ticket-uuid',
 *        'agent-uuid',
 *        'Looking into this now'
 *    );
 * 
 * 3. Update ticket status:
 *    UPDATE tickets 
 *    SET status = 'in_progress', 
 *        assigned_agent_id = 'agent-uuid'
 *    WHERE id = 'ticket-uuid';
 * 
 * 4. Get agent performance metrics:
 *    SELECT * FROM agent_performance 
 *    WHERE organization_id = 'org-uuid'
 *    ORDER BY total_tickets DESC;
 */
