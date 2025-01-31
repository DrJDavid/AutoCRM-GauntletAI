import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabaseClient';
import type { DbProfile, UserRole } from '@/types/database';

interface AuthCredentials {
  email: string;
  password: string;
  type?: 'team' | 'customer';
  organizationSlug?: string;
}

export interface UserState {
  currentUser: DbProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  checkAuth: () => Promise<DbProfile | null>;
  login: (credentials: AuthCredentials) => Promise<DbProfile>;
  signUp: (email: string, password: string, role: UserRole, organizationId?: string) => Promise<void>;
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
        if (authCheckInProgress) return null;
        authCheckInProgress = true;

        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;

          if (!session?.user) {
            set({ currentUser: null, isAuthenticated: false });
            return null;
          }

          // Get profile data
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) throw profileError;

          set({
            currentUser: profile,
            isAuthenticated: true,
            error: null
          });

          return profile;
        } catch (error) {
          console.error('Auth check failed:', error);
          set({
            currentUser: null,
            isAuthenticated: false,
            error: error instanceof Error ? error : new Error('Auth check failed')
          });
          return null;
        } finally {
          authCheckInProgress = false;
        }
      },

      login: async ({ email, password, type, organizationSlug }: AuthCredentials) => {
        try {
          set({ isLoading: true, error: null });
          console.log('Starting login process for:', { email, type, organizationSlug });

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
          if (type) {
            const isTeamMember = ['head_admin', 'admin', 'agent'].includes(profile.role);
            const isCustomer = profile.role === 'customer';

            if (type === 'team') {
              if (!isTeamMember) {
                throw new Error('This login is for team members only.');
              }
              
              // Validate organization slug for team login
              if (!organizationSlug) {
                throw new Error('Organization ID is required for team login');
              }

              // Check if organization exists
              const { data: org, error: orgError } = await supabase
                .from('organizations')
                .select('id')
                .eq('slug', organizationSlug)
                .single();

              if (orgError || !org) {
                throw new Error('Organization not found');
              }
            }
            
            if (type === 'customer' && !isCustomer) {
              throw new Error('This login is for customers only.');
            }
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

      signUp: async (email: string, password: string, role: UserRole, organizationId?: string) => {
        set({ isLoading: true, error: null });
        try {
          // First validate the invitation
          const { data: validationResult, error: validationError } = await supabase
            .rpc('validate_invite_by_email', {
              email_param: email,
              type_param: role === 'customer' ? 'customer' : 'agent'
            });

          if (validationError) throw validationError;
          
          const result = Array.isArray(validationResult) ? validationResult[0] : validationResult;
          
          if (!result || !result.is_valid) {
            throw new Error('No valid invitation found for this email');
          }

          // Sign up the user
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) throw error;
          if (!data.user) throw new Error('No user data after signup');

          // Accept the invitation using the email
          const { error: acceptError } = await supabase
            .rpc('accept_invitation_by_email', {
              invitee_email: email
            });

          if (acceptError) {
            console.error('Failed to accept invitation:', acceptError);
            throw acceptError;
          }

          set({ isLoading: false });
        } catch (error) {
          set({
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