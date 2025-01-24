import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  email: string;
  organization_id: string;
  user_type: 'agent' | 'customer' | 'admin';
}

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) throw new Error('No user data');

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      set({ user: profile });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to login' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to logout' });
    } finally {
      set({ isLoading: false });
    }
  },

  checkSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        // Get profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;
        set({ user: profile });
      } else {
        set({ user: null });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to check session' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
