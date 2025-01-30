import { supabase } from '../mocks/supabase';

export const TEST_USERS = {
  HEAD_ADMIN: {
    email: 'test.admin@acme-corp.com',
    password: 'testpass123!'
  },
  ADMIN: {
    email: 'test.manager@acme-corp.com',
    password: 'testpass123!'
  },
  AGENT: {
    email: 'test.agent@acme-corp.com',
    password: 'testpass123!'
  },
  CUSTOMER: {
    email: 'test.customer@customer.com',
    password: 'testpass123!'
  }
} as const;

export async function createTestUser(email: string, role: 'customer' | 'agent' | 'admin' = 'customer') {
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      id: `test-${Date.now()}`,
      email,
      role,
      organization_id: 'org-id',
      created_at: new Date().toISOString(),
      is_active: true,
      first_name: 'Test',
      last_name: role.charAt(0).toUpperCase() + role.slice(1),
      avatar_url: null,
      department: null,
      last_seen_at: null,
      metadata: null,
      phone: null,
      title: null,
      updated_at: null
    })
    .select('*')
    .single();

  if (error) throw error;
  return profile;
}

export async function loginTestUser(email: string, password: string) {
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return session;
}

export async function logoutTestUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getAuthenticatedClient(email: string, password: string) {
  await loginTestUser(email, password);
  return supabase;
} 