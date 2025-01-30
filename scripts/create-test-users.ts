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

// Organization data
const organization = {
  id: '98a4ffd8-8224-4e5d-958b-ad338368d4b1',
  name: 'ACME Corp',
  domain: 'acme-corp.com',
  settings: {
    support_email: 'support@acme-corp.com',
    billing_email: 'billing@acme-corp.com',
  },
};

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
] as const;

async function ensureOrganizationExists() {
  console.log('Ensuring organization exists...');
  
  const { data: existingOrg, error: checkError } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', organization.id)
    .single();

  if (checkError) {
    console.error('Error checking organization:', checkError);
    return false;
  }

  if (!existingOrg) {
    const { error: insertError } = await supabase
      .from('organizations')
      .insert({
        id: organization.id,
        name: organization.name,
        domain: organization.domain,
        settings: organization.settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error creating organization:', insertError);
      return false;
    }

    console.log('Organization created successfully');
  } else {
    console.log('Organization already exists');
  }

  return true;
}

async function deleteExistingTestUsers() {
  console.log('Cleaning up existing test users...');
  
  for (const user of testUsers) {
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', user.email)
      .single();

    if (existingUser) {
      // Delete from auth.users (this will cascade to profiles due to foreign key)
      await supabase.auth.admin.deleteUser(existingUser.id);
      console.log(`Deleted existing user: ${user.email}`);
    }
  }
}

async function createTestUsers() {
  try {
    // First ensure organization exists
    const orgExists = await ensureOrganizationExists();
    if (!orgExists) {
      throw new Error('Failed to ensure organization exists');
    }

    // Clean up existing test users
    await deleteExistingTestUsers();

    // Create new test users
    for (const user of testUsers) {
      try {
        console.log(`Creating user ${user.email}...`);
        
        // Create the auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        });

        if (authError) {
          console.error(`Failed to create auth user ${user.email}:`, authError.message);
          continue;
        }

        if (!authData.user) {
          console.error(`No user data returned for ${user.email}`);
          continue;
        }

        console.log(`Auth user created successfully for ${user.email}`);

        // Create the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: user.email,
            role: user.role,
            organization_id: user.role === 'customer' ? null : organization.id,
            first_name: user.first_name,
            last_name: user.last_name,
            title: 'title' in user ? user.title : null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {},
          });

        if (profileError) {
          console.error(`Failed to create profile for ${user.email}:`, profileError.message);
          // Clean up auth user if profile creation fails
          await supabase.auth.admin.deleteUser(authData.user.id);
          continue;
        }

        console.log(`Successfully created user and profile for ${user.email} with role ${user.role}`);
      } catch (error) {
        console.error(`Error creating user ${user.email}:`, error);
      }
    }

    console.log('\nTest users created successfully! You can now log in with:');
    testUsers.forEach(user => {
      console.log(`\n${user.role.toUpperCase()}:`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
    });
  } catch (error) {
    console.error('Failed to create test users:', error);
    process.exit(1);
  }
}

createTestUsers(); 
