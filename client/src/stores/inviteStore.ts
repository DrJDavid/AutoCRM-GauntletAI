import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '@/types/supabase';

type InvitationType = Database['public']['Enums']['invitation_type'];
type InvitationStatus = Database['public']['Enums']['invitation_status'];
type UserRole = Database['public']['Enums']['user_role'];
type InvitationInsert = Database['public']['Tables']['invitations']['Insert'];

interface InviteStore {
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  createAgentInvite: (email: string, organizationId: string) => Promise<{ success: boolean; token?: string }>;
  createCustomerInvite: (email: string, organizationId: string) => Promise<{ success: boolean; token?: string }>;
  deleteInvite: (id: string) => Promise<{ success: boolean }>;
  checkInvite: (token: string) => Promise<any>;
}

export const useInviteStore = create<InviteStore>((set) => ({
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  createAgentInvite: async (email: string, organizationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const invitation: InvitationInsert = {
        email,
        organization_id: organizationId,
        type: 'team',
        role: 'agent',
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('invitations')
        .insert(invitation)
        .select()
        .single();

      if (error) throw error;
      return { success: true, token: data.id };
    } catch (err: any) {
      console.error('Error in createAgentInvite:', err);
      set({ error: err.message });
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },

  createCustomerInvite: async (email: string, organizationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const invitation: InvitationInsert = {
        email,
        organization_id: organizationId,
        type: 'customer',
        role: 'customer',
        invited_by: user.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('invitations')
        .insert(invitation)
        .select()
        .single();

      if (error) throw error;
      return { success: true, token: data.id };
    } catch (err: any) {
      console.error('Error in createCustomerInvite:', err);
      set({ error: err.message });
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },

  deleteInvite: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', id)
        .eq('status', 'pending');

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      set({ error: err.message });
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },

  checkInvite: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select()
        .eq('id', token)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      set({ error: err.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
}));
