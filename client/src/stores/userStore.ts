import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabaseClient';
import type { DbProfile } from '@/types/database';

interface AuthCredentials {
  email: string;
  password: string;
  type?: 'team' | 'customer' | 'agent';
  organizationSlug?: string;
}

interface UserState {
  currentUser: DbProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  checkAuth: () => Promise<DbProfile | null>;
  login: (credentials: AuthCredentials) => Promise<DbProfile>;
  signUp: (email: string, password: string, role: string, organizationId?: string) => Promise<void>;
  logout: () => Promise<void>;
}

let authCheckInProgress = false;

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry an operation
const retry = async <T>(
  operation: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
  backoff = 1.5
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries === 0) throw error;
    await delay(delayMs);
    return retry(operation, retries - 1, delayMs * backoff);
  }
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      checkAuth: async () => {
        // Prevent multiple simultaneous auth checks
        if (authCheckInProgress) {
          console.log('Auth check already in progress, skipping...');
          return get().currentUser;
        }

        try {
          authCheckInProgress = true;
          console.log('Starting auth check...');
          
          // Don't set loading if we already have a user
          const currentUser = get().currentUser;
          if (!currentUser) {
            set({ isLoading: true, error: null });
          } else {
            console.log('User already exists in store, skipping auth check');
            return currentUser;
          }
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            throw sessionError;
          }

          if (!session?.user) {
            console.log('No active session');
            set({ 
              currentUser: null, 
              isAuthenticated: false, 
              isLoading: false,
              error: null 
            });
            return null;
          }

          console.log('Session found, fetching profile...');
          // First fetch just the profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select(`
              *,
              organization:organization_id (
                id,
                name,
                slug
              )
            `)
            .eq('id', session.user.id)
            .single();

          if (profileError || !profile) {
            console.error('No profile found');
            throw new Error('Profile not found');
          }

          // Convert to DbProfile
          const dbProfile: DbProfile = {
            id: profile.id,
            email: profile.email,
            organization_id: profile.organization_id,
            role: profile.role,
            is_head_admin: profile.is_head_admin || false,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            is_deleted: false // Set a default value since the column doesn't exist
          };

          console.log('Profile loaded successfully');
          set({
            currentUser: dbProfile,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return dbProfile;

        } catch (error) {
          console.error('Auth check failed:', error);
          set({ 
            currentUser: null, 
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error : new Error('Authentication failed') 
          });
          return null;
        } finally {
          authCheckInProgress = false;
        }
      },

      login: async ({ email, password, type }: AuthCredentials) => {
        try {
          set({ isLoading: true, error: null });
          console.log('Starting login process for:', { email, type });

          // Perform login
          const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) {
            console.error('Auth error:', authError);
            throw authError;
          }
          if (!session) {
            console.error('No session after login');
            throw new Error('No session after login');
          }

          console.log('Auth successful, user ID:', session.user.id);

          // First check if profile exists without organization data
          const { data: basicProfile, error: basicProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          console.log('Basic profile check:', { 
            found: !!basicProfile, 
            error: basicProfileError,
            profile: basicProfile 
          });

          // Get user profile with organization data
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select(`
              *,
              organization:organization_id (
                id,
                name,
                slug
              )
            `)
            .eq('id', session.user.id)
            .single();

          console.log('Full profile check:', {
            found: !!profile,
            error: profileError,
            profile: profile
          });

          if (profileError) {
            console.error('Profile error:', profileError);
            throw new Error(`Failed to fetch profile: ${profileError.message}`);
          }

          if (!profile) {
            console.error('No profile found for user:', session.user.id);
            throw new Error('Profile not found');
          }

          // Verify user type matches if type is provided
          if (type && profile.role !== type) {
            console.error('Invalid login type:', { expected: type, found: profile.role });
            throw new Error(`Invalid login type. This login is for ${type} accounts only.`);
          }

          // Update store state
          console.log('Login successful, updating store with profile:', profile);
          set({
            currentUser: profile,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return profile;

        } catch (error) {
          console.error('Login process failed:', error);
          // Sign out on error to ensure clean state
          await supabase.auth.signOut();
          set({ 
            currentUser: null, 
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error : new Error('Login failed') 
          });
          throw error;
        }
      },

      signUp: async (email: string, password: string, role: string, organizationId?: string) => {
        try {
          set({ isLoading: true, error: null });

          const { data: { session }, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });

          if (signUpError) throw signUpError;
          if (!session) throw new Error('No session after signup');

          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: session.user.id,
                email,
                role,
                organization_id: organizationId,
                is_head_admin: role === 'head_admin',
                full_name: null,
                avatar_url: null,
                is_deleted: false
              },
            ]);

          if (profileError) throw profileError;

          const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select(`
              *,
              organization:organization_id (
                id,
                name,
                slug
              )
            `)
            .eq('id', session.user.id)
            .single();

          if (fetchError) throw fetchError;

          set({
            currentUser: profile as DbProfile,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Signup failed:', error);
          set({
            currentUser: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error : new Error('Signup failed')
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true, error: null });
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          set({
            currentUser: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Logout failed:', error);
          set({
            error: error instanceof Error ? error : new Error('Logout failed')
          });
          throw error;
        }
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);