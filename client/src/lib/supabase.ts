import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Public client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client with service role
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to verify organization access
export const verifyOrganizationAccess = async (organizationSlug: string) => {
  const { data: organization, error } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', organizationSlug)
    .single();

  if (error) throw error;
  return organization;
};

// Helper function to get user profile with organization
export const getUserProfile = async (userId: string) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      organizations (
        id,
        name,
        slug
      )
    `)
    .eq('id', userId)
    .single();

  if (error) throw error;
  return profile;
};