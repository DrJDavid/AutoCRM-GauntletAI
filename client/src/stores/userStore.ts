import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/db/types/database';

// Track if an auth check is in progress to prevent duplicates
let authCheckInProgress = false;

interface AuthCredentials {
  email: string;
  password: string;
  type?: 'team' | 'customer';
  organizationSlug?: string;
}

interface UserState {
  currentUser: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: AuthCredentials) => Promise<Profile | null>;
  signUp: (email: string, password: string, role: string, organizationId?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<Profile | null>;
}

export const useUserStore = create<UserState>()((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  checkAuth: async () => {
    // Prevent multiple simultaneous auth checks
    if (authCheckInProgress) {
      console.log('Auth check already in progress, skipping...');
      return useUserStore.getState().currentUser;
    }

    try {
      authCheckInProgress = true;
      console.log('Starting auth check...');
      
      // Don't set loading if we already have a user
      const currentUser = useUserStore.getState().currentUser;
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
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, organization:organizations(*)')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }

      if (!profile) {
        console.error('No profile found');
        throw new Error('Profile not found');
      }

      console.log('Profile loaded successfully');
      set({
        currentUser: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return profile;

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

  login: async ({ email, password, type, organizationSlug }: AuthCredentials) => {
    try {
      set({ isLoading: true, error: null });

      // Perform login
      const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!session) throw new Error('No session after login');

      // Get user profile with organization data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, organization:organizations(*)')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found');

      // Verify organization access if team login
      if (type === 'team' && organizationSlug) {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, slug')
          .eq('slug', organizationSlug)
          .single();

        if (orgError || !org) {
          throw new Error('Invalid organization');
        }

        if (org.id !== profile.organization_id) {
          throw new Error('You do not have access to this organization');
        }
      }

      // Update store state
      set({
        currentUser: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return profile;

    } catch (error) {
      console.error('Login failed:', error);
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
          },
        ]);

      if (profileError) throw profileError;

      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (fetchError) throw fetchError;

      set({
        currentUser: profile,
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
      // Clear the store state first
      set({ currentUser: null, error: null });
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

    } catch (error) {
      console.error('Logout failed:', error);
      set({
        error: error instanceof Error ? error : new Error('Logout failed')
      });
      throw error;
    }
  },
}));