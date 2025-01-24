-- Add contact information fields to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS business_hours JSONB;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone_numbers JSONB;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_emails JSONB;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS physical_addresses JSONB;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS support_channels JSONB;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS chat_settings JSONB;

COMMENT ON COLUMN organizations.business_hours IS 'Business hours for each day of the week, including special hours and holidays';
COMMENT ON COLUMN organizations.phone_numbers IS 'List of phone numbers with labels (e.g., support, sales)';
COMMENT ON COLUMN organizations.contact_emails IS 'List of email addresses with labels';
COMMENT ON COLUMN organizations.physical_addresses IS 'List of physical addresses with labels';
COMMENT ON COLUMN organizations.support_channels IS 'Configuration for enabled support channels';
COMMENT ON COLUMN organizations.chat_settings IS 'Live chat configuration including hours, routing rules, and auto-responses';

-- Example of the expected JSONB structure for each field:
/*
business_hours = {
  "timezone": "America/Chicago",
  "regular_hours": {
    "monday": [{"open": "09:00", "close": "17:00"}],
    "tuesday": [{"open": "09:00", "close": "17:00"}],
    "wednesday": [{"open": "09:00", "close": "17:00"}],
    "thursday": [{"open": "09:00", "close": "17:00"}],
    "friday": [{"open": "09:00", "close": "17:00"}]
  },
  "holidays": [
    {"date": "2024-12-25", "name": "Christmas", "closed": true}
  ]
}

phone_numbers = [
  {"label": "Support", "number": "+1-555-0123", "hours": "24/7"},
  {"label": "Sales", "number": "+1-555-0124", "hours": "Mon-Fri 9-5"}
]

contact_emails = [
  {"label": "Support", "email": "support@example.com"},
  {"label": "Sales", "email": "sales@example.com"}
]

physical_addresses = [
  {
    "label": "Headquarters",
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701",
    "country": "USA"
  }
]

support_channels = {
  "email": {"enabled": true},
  "phone": {"enabled": true},
  "chat": {"enabled": true},
  "ticket": {"enabled": true}
}

chat_settings = {
  "enabled": true,
  "operating_hours": {
    "inherit_business_hours": true,
    "custom_hours": null
  },
  "queue_settings": {
    "max_queue_size": 10,
    "max_wait_time": 300
  },
  "auto_responses": {
    "welcome": "Welcome to our support chat! An agent will be with you shortly.",
    "offline": "We're currently offline. Please leave a message or create a ticket.",
    "queue": "You are number {position} in the queue. Estimated wait time: {wait_time}."
  },
  "routing": {
    "method": "round_robin",
    "fallback_agent_id": null
  }
}
*/

-- Add RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy for viewing organization contact info
CREATE POLICY "Anyone can view organization contact info" ON organizations
    FOR SELECT
    USING (true);

-- Policy for updating organization settings
CREATE POLICY "Only org admins can update organization settings" ON organizations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = organizations.id
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = organizations.id
            AND profiles.role = 'admin'
        )
    );
