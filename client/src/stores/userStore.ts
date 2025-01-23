import { create } from 'zustand';
import { supabase, getUserProfile, verifyOrganizationAccess } from '@/lib/supabase';

interface AuthCredentials {
  type: 'team' | 'customer';
  email: string;
  password: string;
  organizationSlug?: string;
}

interface User {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'customer';
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  signUp: (email: string, password: string, role: string, organizationId?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      // If no session, clear state and return
      if (!session) {
        set({ 
          currentUser: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: null 
        });
        return;
      }

      // Get user profile
      const profile = await getUserProfile(session.user.id);
      
      set({
        currentUser: {
          id: session.user.id,
          email: session.user.email!,
          role: profile.role,
          organization: profile.organizations,
        },
        isAuthenticated: true,
        error: null
      });

      // Setup auth state change listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          set({ 
            currentUser: null, 
            isAuthenticated: false,
            error: null 
          });
        } else if (event === 'SIGNED_IN' && session) {
          const profile = await getUserProfile(session.user.id);
          set({
            currentUser: {
              id: session.user.id,
              email: session.user.email!,
              role: profile.role,
              organization: profile.organizations,
            },
            isAuthenticated: true,
            error: null
          });
        }
      });

    } catch (error) {
      console.error('Auth check failed:', error);
      set({ 
        currentUser: null, 
        isAuthenticated: false,
        error: error as Error 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async ({ type, email, password, organizationSlug }: AuthCredentials) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const profile = await getUserProfile(data.user.id);

        set({
          currentUser: {
            id: data.user.id,
            email: data.user.email!,
            role: profile.role,
            organization: profile.organizations,
          },
          isAuthenticated: true,
          error: null
        });

        // Redirect based on role
        const role = profile.role;
        if (role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else if (role === 'agent') {
          window.location.href = '/agent/dashboard';
        } else {
          window.location.href = '/customer/dashboard';
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      set({ 
        error: error as Error,
        isAuthenticated: false,
        currentUser: null
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string, role: string, organizationId?: string) => {
    try {
      set({ isLoading: true, error: null });

      // Clean the email
      const cleanEmail = email.trim().toLowerCase();
      console.log('Attempting signup with cleaned email:', cleanEmail);

      // First check if user exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .single();

      if (existingUser) {
        throw new Error('An account with this email already exists');
      }

      if (!organizationId) {
        throw new Error('Organization ID is required for registration');
      }

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            role,
            organization_id: organizationId,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      });

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }
      if (!data.user) throw new Error('Failed to create user account');

      console.log('User created successfully:', data.user);

      // Create profile with organization_id
      const profileData = {
        id: data.user.id,
        email: cleanEmail,
        role,
        organization_id: organizationId, // Ensure this is set
      };

      console.log('Creating profile with data:', profileData);

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        console.error('Failed to create profile:', profileError);
        throw new Error('Failed to create user profile');
      }

      console.log('Profile created successfully');

      // Set the user state
      set({
        isLoading: false,
        error: null,
        currentUser: {
          id: data.user.id,
          email: cleanEmail,
          role,
          organization: {
            id: organizationId,
            name: '', // We can fetch this later if needed
            slug: ''  // We can fetch this later if needed
          }
        },
        isAuthenticated: true
      });

    } catch (error) {
      console.error('Registration failed:', error);
      set({ error: error as Error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      
      // First clear the auth state
      set({
        currentUser: null,
        isAuthenticated: false,
        error: null
      });

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear any persisted state
      localStorage.removeItem('supabase.auth.token');
      
      // Redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));