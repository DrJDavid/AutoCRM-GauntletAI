import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          currentUser: {
            id: session.user.id,
            email: session.user.email!,
            role: userProfile?.role || 'customer'
          },
          isAuthenticated: true
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    if (data.user) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      set({
        currentUser: {
          id: data.user.id,
          email: data.user.email!,
          role: userProfile?.role || 'customer'
        },
        isAuthenticated: true
      });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ currentUser: null, isAuthenticated: false });
  }
}));
