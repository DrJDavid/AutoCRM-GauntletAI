import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthCredentials {
  type: 'team' | 'customer';
  email: string;
  password: string;
  organizationSlug?: string;
}

interface UserState {
  currentUser: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  signUp: (email: string, password: string, role: string, organizationId?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useUserStore = create<UserState>()((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  checkAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session) {
        set({ 
          currentUser: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: null 
        });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      set({
        currentUser: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('Auth check failed:', error);
      set({ 
        currentUser: null, 
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Authentication failed') 
      });
    }
  },

  login: async ({ email, password }: AuthCredentials) => {
    try {
      set({ isLoading: true, error: null });

      const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!session) throw new Error('No session after login');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      set({
        currentUser: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Login failed:', error);
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