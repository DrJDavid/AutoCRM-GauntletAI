import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

interface InviteStore {
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  createAgentInvite: (email: string, organizationId: string, message?: string) => Promise<{ success: boolean }>;
  createCustomerInvite: (email: string, organizationId: string, message?: string) => Promise<{ success: boolean }>;
  deleteInvite: (id: string, type: 'agent' | 'customer') => Promise<{ success: boolean }>;
  checkInvite: (email: string, type: 'agent' | 'customer') => Promise<any>;
}

export const useInviteStore = create<InviteStore>((set, get) => ({
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  createAgentInvite: async (email: string, organizationId: string, message?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('agent_organization_invites')
        .insert([
          {
            email,
            organization_id: organizationId,
            message,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true };
    } catch (err: any) {
      set({ error: err.message });
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },

  createCustomerInvite: async (email: string, organizationId: string, message?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('customer_organization_invites')
        .insert([
          {
            email,
            organization_id: organizationId,
            message,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true };
    } catch (err: any) {
      set({ error: err.message });
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },

  deleteInvite: async (id: string, type: 'agent' | 'customer') => {
    set({ isLoading: true, error: null });
    
    try {
      const table = type === 'agent' ? 'agent_organization_invites' : 'customer_organization_invites';
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (err: any) {
      set({ error: err.message });
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },

  checkInvite: async (email: string, type: 'agent' | 'customer') => {
    set({ isLoading: true, error: null });
    try {
      const table = type === 'agent' ? 'agent_organization_invites' : 'customer_organization_invites';
      const { data, error } = await supabase
        .from(table)
        .select('*, organizations(*)')
        .eq('email', email)
        .eq('accepted', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check invite';
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ isLoading: false });
    }
  },
}));
