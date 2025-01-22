import { createClient } from '@supabase/supabase-js';

// Debug all environment variables
console.log('Mode:', import.meta.env.MODE);
console.log('Base URL:', import.meta.env.BASE_URL);
console.log('DEV:', import.meta.env.DEV);

// Access environment variables directly without optional chaining
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log('Raw env values:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

// Public client - only uses anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Remove admin client from frontend code
// Admin operations should be handled by the backend API

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