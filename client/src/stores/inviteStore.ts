import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

interface InviteStore {
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  createAgentInvite: (email: string, organizationId: string) => Promise<{ success: boolean; token?: string }>;
  createCustomerInvite: (email: string, organizationId: string) => Promise<{ success: boolean; token?: string }>;
  deleteInvite: (id: string, type: 'agent' | 'customer') => Promise<{ success: boolean }>;
  checkInvite: (email: string, type: 'agent' | 'customer') => Promise<any>;
}

export const useInviteStore = create<InviteStore>((set, get) => ({
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  createAgentInvite: async (email: string, organizationId: string) => {
    console.log('Creating agent invite:', { email, organizationId });
    set({ isLoading: true, error: null });
    
    try {
      // First try the new create_invite function
      console.log('Attempting to create invite with create_invite function...');
      const { data: token, error: rpcError } = await supabase.rpc('create_invite', {
        org_id: organizationId,
        email,
        invite_type: 'agent'
      });

      if (rpcError) {
        console.error('RPC error:', rpcError);
        // Fall back to direct table insert if RPC fails
        console.log('Falling back to direct table insert...');
        const { data, error: insertError } = await supabase
          .from('agent_organization_invites')
          .insert([
            {
              email,
              organization_id: organizationId,
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
              token: crypto.randomUUID(), // Generate UUID on client side
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        console.log('Insert successful:', data);
        return { success: true, token: data.token };
      }

      console.log('RPC successful:', token);
      return { success: true, token };
    } catch (err: any) {
      console.error('Error in createAgentInvite:', err);
      set({ error: err.message });
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },

  createCustomerInvite: async (email: string, organizationId: string) => {
    console.log('Creating customer invite:', { email, organizationId });
    set({ isLoading: true, error: null });
    
    try {
      // First try the new create_invite function
      console.log('Attempting to create invite with create_invite function...');
      const { data: token, error: rpcError } = await supabase.rpc('create_invite', {
        org_id: organizationId,
        email,
        invite_type: 'customer'
      });

      if (rpcError) {
        console.error('RPC error:', rpcError);
        // Fall back to direct table insert if RPC fails
        console.log('Falling back to direct table insert...');
        const { data, error: insertError } = await supabase
          .from('customer_organization_invites')
          .insert([
            {
              email,
              organization_id: organizationId,
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
              token: crypto.randomUUID(), // Generate UUID on client side
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        console.log('Insert successful:', data);
        return { success: true, token: data.token };
      }

      console.log('RPC successful:', token);
      return { success: true, token };
    } catch (err: any) {
      console.error('Error in createCustomerInvite:', err);
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
        .select()
        .eq('email', email)
        .eq('accepted', false)
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
