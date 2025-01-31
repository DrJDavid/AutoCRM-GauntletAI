import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type InvitationType = Database['public']['Enums']['invitation_type'];

interface InvitationStore {
  isLoading: boolean;
  error: Error | null;
  validationResult: any;
  validateInvitation: (email: string, type: InvitationType) => Promise<any>;
  acceptInvitation: (email: string) => Promise<any>;
}

export const useInvitationStore = create<InvitationStore>((set) => ({
  isLoading: false,
  error: null,
  validationResult: null,
  validateInvitation: async (email: string, type: InvitationType) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.rpc('validate_invite_by_email', {
        email_param: email,
        type_param: type
      });
      if (error) throw error;
      set({ validationResult: data });
      return data;
    } catch (error) {
      set({ error: error as Error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  acceptInvitation: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase.rpc('accept_invitation_by_email', {
        invitee_email: email
      });
      if (error) throw error;
      return data;
    } catch (error) {
      set({ error: error as Error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  }
})); 