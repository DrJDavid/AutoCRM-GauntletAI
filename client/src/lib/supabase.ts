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

export const subscribeToTickets = (callback: (payload: any) => void) => {
  const channel = supabase
    .channel('tickets')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tickets' },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

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

// Helper function to subscribe to organization changes
export const subscribeToOrganization = (organizationId: string, callback: (payload: any) => void) => {
  const channel = supabase
    .channel(`org-${organizationId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'organizations', filter: `id=eq.${organizationId}` },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};