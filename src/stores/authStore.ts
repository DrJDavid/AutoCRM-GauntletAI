import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole, Organization } from '../types/database.types';

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole, organizationId: string) => Promise<void>;
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

      // Get profile data with organization
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations (
            id,
            name,
            slug,
            settings,
            metadata,
            is_active,
            created_at,
            updated_at
          )
        `)
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;
      if (!data) throw new Error('No profile data');

      // Ensure the data matches our Profile type
      const profile: Profile = {
        id: data.id,
        organization_id: data.organization_id,
        role: data.role,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        avatar_url: data.avatar_url,
        title: data.title,
        department: data.department,
        metadata: data.metadata,
        created_at: data.created_at,
        updated_at: data.updated_at,
        last_seen_at: data.last_seen_at,
        is_active: data.is_active,
        organization: data.organization || undefined,
      };

      set({ user: profile });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to login' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (email: string, password: string, role: UserRole, organizationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user data');

      const now = new Date().toISOString();

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          role,
          organization_id: organizationId,
          is_active: true,
          created_at: now,
          updated_at: now,
          metadata: {},
        });

      if (profileError) throw profileError;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to sign up' });
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
      throw error;
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
        // Get profile data with organization
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            organization:organizations (
              id,
              name,
              slug,
              settings,
              metadata,
              is_active,
              created_at,
              updated_at
            )
          `)
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;
        if (!data) throw new Error('No profile data');

        // Ensure the data matches our Profile type
        const profile: Profile = {
          id: data.id,
          organization_id: data.organization_id,
          role: data.role,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          avatar_url: data.avatar_url,
          title: data.title,
          department: data.department,
          metadata: data.metadata,
          created_at: data.created_at,
          updated_at: data.updated_at,
          last_seen_at: data.last_seen_at,
          is_active: data.is_active,
          organization: data.organization || undefined,
        };

        set({ user: profile });
      } else {
        set({ user: null });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to check session' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
})); 
