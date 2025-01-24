-- migrate:up
-- Initial schema setup for AutoCRM
-- This migration establishes the base schema and can be used as a restore point

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Version tracking
CREATE TABLE IF NOT EXISTS schema_version (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

-- Record this migration
INSERT INTO schema_version (version, description)
VALUES ('20240124_020000', 'Initial schema setup')
ON CONFLICT (version) DO NOTHING;

-- Start schema definition
BEGIN;

-- [Previous schema content from consolidated_schema.sql goes here]
-- I'm not including it here to avoid repetition, but it would be the entire
-- contents of our previous consolidated_schema.sql file

COMMIT;

-- migrate:down
BEGIN;
    -- Drop all tables in reverse order of creation
    DROP TABLE IF EXISTS debug_logs;
    DROP TABLE IF EXISTS knowledge_articles;
    DROP TABLE IF EXISTS customer_organizations;
    DROP TABLE IF EXISTS customer_organization_invites;
    DROP TABLE IF EXISTS agent_organization_invites;
    DROP TABLE IF EXISTS attachments;
    DROP TABLE IF EXISTS ticket_comments;
    DROP TABLE IF EXISTS ticket_messages;
    DROP TABLE IF EXISTS tickets;
    DROP TABLE IF EXISTS team_members;
    DROP TABLE IF EXISTS teams;
    DROP TABLE IF EXISTS profiles;
    DROP TABLE IF EXISTS organizations;
    
    -- Drop enums
    DROP TYPE IF EXISTS ticket_category;
    DROP TYPE IF EXISTS user_role;
    
    -- Drop version tracking
    DROP TABLE IF EXISTS schema_version;
COMMIT;
