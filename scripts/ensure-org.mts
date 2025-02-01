import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import type { Database } from '../client/src/types/supabase';

// Load environment variables
config();

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

async function signIn() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'david.johnson@gauntletai.com',
    password: 'Testpass123!'
  });

  if (error) {
    console.error('Error signing in:', error);
    process.exit(1);
  }

  return data;
}

async function main() {
  console.log('🔑 Signing in...');
  await signIn();
  console.log('✨ Signed in successfully');

  // Check if we have any organization
  const { data: org } = await supabase
    .from('organizations')
    .select()
    .limit(1)
    .single();

  if (!org) {
    console.log('Creating default organization...');
    const { data: newOrg, error } = await supabase
      .from('organizations')
      .insert({
        name: 'AutoCRM Test Organization',
        slug: 'autocrm-test',
        is_active: true,
        settings: {
          allowAIAssistant: true,
          defaultLanguage: 'en',
          timezone: 'UTC'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      process.exit(1);
    }

    console.log('✨ Created organization:', newOrg.name);
    return newOrg;
  }

  console.log('✨ Using existing organization:', org.name);
  return org;
}

main().catch(console.error); 