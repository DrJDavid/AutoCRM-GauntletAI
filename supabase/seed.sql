-- Create auth.users first
insert into auth.users (id, email)
values
  ('2d196d44-ae7f-4999-b080-e8a0db639c65', 'john.doe@acme-corp.com'),
  ('91f2c7c2-ee96-4ea8-8faf-423e4e4c3c4b', 'jane.smith@acme-corp.com'),
  ('c9c0b4f8-4d6b-4c77-b7e4-bd87c42f9d56', 'bob.wilson@acme-corp.com'),
  ('d8b6e8f7-3d44-4f3e-9c9a-8d8d8e7f6d5c', 'alice.johnson@acme-corp.com'),
  ('e7c5b3a2-1d9e-4f8c-b7a6-5c4b3e2d1a9f', 'mike.brown@customer.com'),
  ('f6d4c2b1-9e8d-7f6e-5d4c-3b2a1e9d8c7b', 'sarah.davis@customer.com');

-- Seed organization
insert into organizations (id, name, slug, settings, metadata, is_active, created_at, updated_at)
values (
  '98a4ffd8-8224-4e5d-958b-ad338368d4b1',
  'Acme Corporation',
  'acme-corp',
  jsonb_build_object(
    'support_hours', '24/7',
    'default_language', 'en',
    'support_email', 'support@acme-corp.com',
    'billing_email', 'billing@acme-corp.com'
  ),
  '{}'::jsonb,
  true,
  NOW(),
  NOW()
);

-- Seed user profiles
-- Head Admin
insert into profiles (id, organization_id, role, first_name, last_name, email, title)
values (
  '2d196d44-ae7f-4999-b080-e8a0db639c65',
  '98a4ffd8-8224-4e5d-958b-ad338368d4b1',
  'head_admin',
  'John',
  'Doe',
  'john.doe@acme-corp.com',
  'Head of Customer Support'
);

-- Admin
insert into profiles (id, organization_id, role, first_name, last_name, email, title)
values (
  '91f2c7c2-ee96-4ea8-8faf-423e4e4c3c4b',
  '98a4ffd8-8224-4e5d-958b-ad338368d4b1',
  'admin',
  'Jane',
  'Smith',
  'jane.smith@acme-corp.com',
  'Support Team Lead'
);

-- Agents
insert into profiles (id, organization_id, role, first_name, last_name, email, title)
values 
  (
    'c9c0b4f8-4d6b-4c77-b7e4-bd87c42f9d56',
    '98a4ffd8-8224-4e5d-958b-ad338368d4b1',
    'agent',
    'Bob',
    'Wilson',
    'bob.wilson@acme-corp.com',
    'Senior Support Agent'
  ),
  (
    'd8b6e8f7-3d44-4f3e-9c9a-8d8d8e7f6d5c',
    '98a4ffd8-8224-4e5d-958b-ad338368d4b1',
    'agent',
    'Alice',
    'Johnson',
    'alice.johnson@acme-corp.com',
    'Support Agent'
  );

-- Customers
insert into profiles (id, organization_id, role, first_name, last_name, email)
values 
  (
    'e7c5b3a2-1d9e-4f8c-b7a6-5c4b3e2d1a9f',
    '98a4ffd8-8224-4e5d-958b-ad338368d4b1',
    'customer',
    'Mike',
    'Brown',
    'mike.brown@customer.com'
  ),
  (
    'f6d4c2b1-9e8d-7f6e-5d4c-3b2a1e9d8c7b',
    '98a4ffd8-8224-4e5d-958b-ad338368d4b1',
    'customer',
    'Sarah',
    'Davis',
    'sarah.davis@customer.com'
  );

-- Seed AI agents
insert into ai_agents (id, organization_id, name, description, configuration)
values
  (
    'a1b2c3d4-e5f6-4a5b-9c8d-7e6f5d4c3b2a',
    '98a4ffd8-8224-4e5d-958b-ad338368d4b1',
    'General Support Bot',
    'Handles general customer inquiries and basic troubleshooting',
    '{
      "model": "gpt-4",
      "temperature": 0.7,
      "max_tokens": 500,
      "capabilities": ["general_support", "troubleshooting"]
    }'::jsonb
  ),
  (
    'b2c3d4e5-f6a7-4b6c-ad1e-8f7a6b5c4d3e',
    '98a4ffd8-8224-4e5d-958b-ad338368d4b1',
    'Technical Expert Bot',
    'Specialized in technical product support and advanced issues',
    '{
      "model": "gpt-4",
      "temperature": 0.5,
      "max_tokens": 800,
      "capabilities": ["technical_support", "code_analysis", "debugging"]
    }'::jsonb
  );

-- Seed tickets
insert into tickets (id, organization_id, customer_id, assigned_to, title, description, status, priority)
values
  (
    'c3d4e5f6-a7b8-4c7d-9e2f-1a2b3c4d5e6f',
    '98a4ffd8-8224-4e5d-958b-ad338368d4b1',
    'e7c5b3a2-1d9e-4f8c-b7a6-5c4b3e2d1a9f',
    'c9c0b4f8-4d6b-4c77-b7e4-bd87c42f9d56',
    'Cannot access dashboard',
    'I am unable to access my dashboard since this morning. Getting a 404 error.',
    'in_progress',
    'high'
  ),
  (
    'd4e5f6a7-b8c9-4d8e-af3a-2b3c4d5e6f7a',
    '98a4ffd8-8224-4e5d-958b-ad338368d4b1',
    'f6d4c2b1-9e8d-7f6e-5d4c-3b2a1e9d8c7b',
    'd8b6e8f7-3d44-4f3e-9c9a-8d8d8e7f6d5c',
    'Feature request: Dark mode',
    'Would love to see a dark mode option in the application.',
    'open',
    'medium'
  );

-- Seed ticket messages
insert into ticket_messages (ticket_id, sender_id, message, is_internal)
values
  (
    'c3d4e5f6-a7b8-4c7d-9e2f-1a2b3c4d5e6f',
    'e7c5b3a2-1d9e-4f8c-b7a6-5c4b3e2d1a9f',
    'I have tried clearing my cache and cookies, but still no luck.',
    false
  ),
  (
    'c3d4e5f6-a7b8-4c7d-9e2f-1a2b3c4d5e6f',
    'c9c0b4f8-4d6b-4c77-b7e4-bd87c42f9d56',
    'I will look into this right away. Can you please provide your browser version?',
    false
  ),
  (
    'c3d4e5f6-a7b8-4c7d-9e2f-1a2b3c4d5e6f',
    'c9c0b4f8-4d6b-4c77-b7e4-bd87c42f9d56',
    'Checking server logs for any potential issues.',
    true
  );

-- Seed AI agent assignments
insert into ai_agent_assignments (agent_id, ticket_id, status)
values
  (
    'a1b2c3d4-e5f6-4a5b-9c8d-7e6f5d4c3b2a',
    'c3d4e5f6-a7b8-4c7d-9e2f-1a2b3c4d5e6f',
    'active'
  );

-- Seed AI agent responses
insert into ai_agent_responses (assignment_id, content, confidence_score)
values
  (
    (select id from ai_agent_assignments where ticket_id = 'c3d4e5f6-a7b8-4c7d-9e2f-1a2b3c4d5e6f'),
    'Based on the description, this appears to be a session-related issue. Recommended troubleshooting steps: 1) Clear browser cache 2) Try incognito mode 3) Check if the issue persists across different browsers.',
    0.85
  ); 