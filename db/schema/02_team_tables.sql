/*
 * Team Management Tables
 * =====================
 * This file contains tables related to team management within organizations.
 * Teams are groups of agents that can be assigned to tickets and manage
 * knowledge articles together.
 */

-- Teams Table
-- ===========
-- Represents teams within an organization
CREATE TABLE public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb  -- Flexible metadata storage
);

COMMENT ON TABLE public.teams IS 'Teams within organizations for group management';
COMMENT ON COLUMN teams.metadata IS 'Flexible JSON storage for team settings';

-- Example metadata structure:
/*
{
    "maxTickets": 100,
    "autoAssignment": true,
    "specialties": ["billing", "technical"],
    "workingHours": {
        "monday": {"start": "09:00", "end": "17:00"},
        "tuesday": {"start": "09:00", "end": "17:00"}
    }
}
*/

-- Team Members Table
-- =================
-- Junction table linking profiles to teams
CREATE TABLE public.team_members (
    team_id UUID REFERENCES teams NOT NULL,
    profile_id UUID REFERENCES profiles NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'lead')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (team_id, profile_id)
);

COMMENT ON TABLE public.team_members IS 'Links profiles to teams with roles';

-- Team Performance View
-- ====================
-- Materialized view for team performance metrics
CREATE VIEW team_performance AS
SELECT 
    t.id as team_id,
    t.name as team_name,
    COUNT(DISTINCT tm.profile_id) as team_size,
    COUNT(DISTINCT tk.id) as total_tickets,
    COUNT(DISTINCT CASE WHEN tk.status = 'resolved' THEN tk.id END) as resolved_tickets
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
LEFT JOIN tickets tk ON tk.assigned_team_id = t.id
GROUP BY t.id, t.name;

COMMENT ON VIEW team_performance IS 'Real-time team performance metrics';

-- Indexes
-- =======
CREATE INDEX idx_teams_organization ON teams(organization_id);
CREATE INDEX idx_team_members_profile ON team_members(profile_id);

-- Row Level Security
-- =================

-- Teams RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Teams viewable by organization members
CREATE POLICY "Teams viewable by organization members" 
    ON teams FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.organization_id = teams.organization_id 
            AND profiles.id = auth.uid()
        )
    );

-- Teams manageable by admins and team leads
CREATE POLICY "Teams manageable by admins and leads" 
    ON teams FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.organization_id = teams.organization_id 
            AND profiles.id = auth.uid()
            AND (
                profiles.role = 'admin' 
                OR EXISTS (
                    SELECT 1 FROM team_members 
                    WHERE team_members.team_id = teams.id 
                    AND team_members.profile_id = profiles.id 
                    AND team_members.role = 'lead'
                )
            )
        )
    );

-- Team Members RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Team members viewable by organization members
CREATE POLICY "Team members viewable by organization members" 
    ON team_members FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM teams t
            JOIN profiles p ON t.organization_id = p.organization_id
            WHERE t.id = team_members.team_id 
            AND p.id = auth.uid()
        )
    );

/*
 * Usage Examples
 * =============
 * 
 * 1. Create a new team:
 *    INSERT INTO teams (organization_id, name, description) 
 *    VALUES ('org-uuid', 'Support Team A', 'Primary support team');
 * 
 * 2. Add a member to a team:
 *    INSERT INTO team_members (team_id, profile_id, role) 
 *    VALUES ('team-uuid', 'profile-uuid', 'member');
 * 
 * 3. Get team performance metrics:
 *    SELECT * FROM team_performance 
 *    WHERE team_id = 'team-uuid';
 * 
 * 4. Find all teams for a user:
 *    SELECT t.* 
 *    FROM teams t
 *    JOIN team_members tm ON t.id = tm.team_id
 *    WHERE tm.profile_id = 'profile-uuid';
 */
