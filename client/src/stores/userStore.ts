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
  login: (credentials: AuthCredentials) => Promise<void>;
  signUp: (email: string, password: string, role: string, organizationId?: string) => Promise<void>;
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

      if (session?.user) {
        const profile = await getUserProfile(session.user.id);
        set({
          currentUser: {
            id: session.user.id,
            email: session.user.email!,
            role: profile.role,
            organization: profile.organizations,
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

  login: async ({ type, email, password, organizationSlug }: AuthCredentials) => {
    if (type === 'team' && !organizationSlug) {
      throw new Error('Organization ID is required for team login');
    }

    // For team members, verify organization access first
    if (type === 'team') {
      await verifyOrganizationAccess(organizationSlug!);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const profile = await getUserProfile(data.user.id);

      // Verify user has access to the specified organization
      if (type === 'team' && profile.organizations?.slug !== organizationSlug) {
        await supabase.auth.signOut();
        throw new Error('You do not have access to this organization');
      }

      set({
        currentUser: {
          id: data.user.id,
          email: data.user.email!,
          role: profile.role,
          organization: profile.organizations,
        },
        isAuthenticated: true
      });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ currentUser: null, isAuthenticated: false });
  },

  signUp: async (email: string, password: string, role: string, organizationId?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          organization_id: organizationId
        }
      }
    });

    if (error) throw error;

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            role: role,
            organization_id: organizationId
          }
        ]);

      if (profileError) throw profileError;

      set({
        currentUser: {
          id: data.user.id,
          email: data.user.email!,
          role: role as 'admin' | 'agent' | 'customer',
          organization: organizationId ? {
            id: organizationId,
            name: '', // Will be populated on next auth check
            slug: ''
          } : undefined
        },
        isAuthenticated: true
      });
    }
  }
}));