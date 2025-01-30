import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables. Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createOrgForUser(email: string) {
  try {
    // First get the auth user
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;

    const user = users.find(u => u.email === email);
    if (!user) {
      throw new Error(`No user found with email ${email}`);
    }

    // Create the organization
    const orgSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert([
        {
          name: `${orgSlug}'s Organization`,
          slug: orgSlug,
          settings: {
            support_hours: '24/7',
            default_language: 'en',
            support_email: `support@${orgSlug}.com`,
            billing_email: `billing@${orgSlug}.com`
          },
          metadata: {},
          is_active: true
        }
      ])
      .select()
      .single();

    if (orgError) {
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    // Create the admin profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          email: user.email,
          role: 'head_admin',
          organization_id: orgData.id,
          is_active: true
        }
      ])
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, cleanup
      await supabase.from('organizations').delete().eq('id', orgData.id);
      throw new Error(`Failed to create admin profile: ${profileError.message}`);
    }

    console.log('✅ Successfully created organization and profile:');
    console.log('Organization:', orgData);
    console.log('Profile:', profileData);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address as an argument');
  console.error('Example: npm run create-org-for-user your.email@example.com');
  process.exit(1);
}

createOrgForUser(email); 