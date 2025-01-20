import { createClient } from '@supabase/supabase-js';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

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