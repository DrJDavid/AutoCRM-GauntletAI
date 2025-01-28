import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_LOCAL_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing required environment variables. Please ensure VITE_LOCAL_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const ORGANIZATION_ID = '98a4ffd8-8224-4e5d-958b-ad338368d4b1';  // From our seed.sql

const testUsers = [
  {
    email: 'test.admin@acme-corp.com',
    password: 'testpass123!',
    role: 'head_admin',
    first_name: 'Test',
    last_name: 'Admin',
    title: 'Test Head of Customer Support',
  },
  {
    email: 'test.manager@acme-corp.com',
    password: 'testpass123!',
    role: 'admin',
    first_name: 'Test',
    last_name: 'Manager',
    title: 'Test Support Team Lead',
  },
  {
    email: 'test.agent@acme-corp.com',
    password: 'testpass123!',
    role: 'agent',
    first_name: 'Test',
    last_name: 'Agent',
    title: 'Test Support Agent',
  },
  {
    email: 'test.customer@customer.com',
    password: 'testpass123!',
    role: 'customer',
    first_name: 'Test',
    last_name: 'Customer',
  },
];

async function createTestUsers() {
  for (const user of testUsers) {
    try {
      console.log(`Creating user ${user.email}...`);
      
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        console.error(`Failed to create auth user ${user.email}:`, authError.message);
        console.error('Full error:', JSON.stringify(authError, null, 2));
        continue;
      }

      if (!authData.user) {
        console.error(`No user data returned for ${user.email}`);
        continue;
      }

      console.log(`Auth user created successfully for ${user.email}`);

      // Then create the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: user.email,
          role: user.role,
          organization_id: ORGANIZATION_ID,
          first_name: user.first_name,
          last_name: user.last_name,
          title: user.title,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {},
        });

      if (profileError) {
        console.error(`Failed to create profile for ${user.email}:`, profileError.message);
        console.error('Full profile error:', JSON.stringify(profileError, null, 2));
        continue;
      }

      console.log(`Successfully created user and profile for ${user.email} with role ${user.role}`);
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
    }
  }
}

createTestUsers(); 
