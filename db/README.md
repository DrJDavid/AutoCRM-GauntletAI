# AutoCRM Database Architecture

## Overview
AutoCRM uses Supabase as its database backend, providing a secure, multi-tenant architecture for customer relationship management. The system is designed with strong data isolation and role-based access control.

## Core Features
- 🏢 **Multi-tenant Architecture**: Organizations are completely isolated
- 🔐 **Row Level Security (RLS)**: Built-in data protection at the row level
- 👥 **Role-Based Access**: Admin, Agent, and Customer roles
- 🔄 **Real-time Updates**: Live data sync via Supabase subscriptions
- 📚 **Knowledge Management**: Internal knowledge base system
- 🎫 **Ticket System**: Full customer support ticket management

## Key Tables

### Core Tables
- `organizations`: Root entity for multi-tenant system
  - Contains: name, slug, settings (JSONB)
  - Relations: profiles, teams, tickets
  - Security: Viewable by members, editable by admins

- `profiles`: User profiles (extends Supabase Auth)
  - Contains: email, role, organization_id
  - Relations: organizations, teams, tickets
  - Security: Basic info viewable by org members

### Team Management
- `teams`: Organizational units
  - Contains: name, description, metadata
  - Relations: team_members, tickets
  - Security: Viewable by org members

- `team_members`: Team assignments
  - Contains: team_id, profile_id, role
  - Relations: teams, profiles
  - Security: Viewable by org members

### Ticket System
- `tickets`: Customer support tickets
  - Contains: title, description, status, priority
  - Relations: customer, assigned_agent, organization
  - Security: Org-based visibility

### Knowledge Base
- `knowledge_articles`: Internal documentation
  - Contains: title, content, tags, metadata
  - Relations: organization, author
  - Security: Org-based visibility

### Invitation System
- `agent_invites`: Admin-managed invites for new agents
  - Contains: email, invited_by, expires_at, accepted_at
  - Relations: organizations, profiles (invited_by)
  - Security: Manageable by admins only
  - Features: 7-day expiration, acceptance tracking

- `customer_invites`: Admin-managed invites for new customers
  - Contains: email, invited_by, expires_at, accepted_at
  - Relations: organizations, profiles (invited_by)
  - Security: Manageable by admins only
  - Features: 7-day expiration, acceptance tracking

### Helper Functions
- `check_agent_invite`: Validates agent invite status
- `check_customer_invite`: Validates customer invite status
- `accept_invite`: Marks an invite as accepted

## Security Model

### Row Level Security (RLS)
Each table is protected by RLS policies ensuring:
1. Organization-level data isolation
2. Role-based access control
3. Secure invite system

Example policies:
```sql
-- Organizations viewable by members
CREATE POLICY "Organizations are viewable by organization members" 
  ON organizations FOR SELECT 
  USING (auth.uid() IN (
    SELECT profiles.id FROM profiles 
    WHERE profiles.organization_id = organizations.id
  ));
```

### Roles and Permissions
1. **Admin**
   - Manage organization settings
   - Invite team members
   - Full access to all org data

2. **Agent**
   - Handle tickets
   - Create knowledge articles
   - View team data

3. **Customer**
   - Create and view own tickets
   - View permitted knowledge articles

## Performance Optimization
- Indexes on frequently queried columns
- JSONB indexes for metadata fields
- Materialized views for analytics
- Proper foreign key constraints

## Views
1. `agent_performance`
   - Tracks ticket metrics per agent
   - Used for analytics dashboard

2. `team_performance`
   - Aggregates team-level metrics
   - Used for team management

## Type Safety
TypeScript types are available in `db/types/database.ts` providing:
- Full type coverage for database schema
- Autocomplete in IDE
- Runtime type checking
- Documentation through types
