import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient'

// Utility hook to deal with invitations
export const useInvitations = () => {
  // Accept an invitation by calling the unified RPC
  const acceptInvitation = async (invitationToken: string) => {
    const { data, error } = await supabase.rpc('accept_invitation', { invitation_token: invitationToken });
    if (error) {
      throw error;
    }
    return data; // Returns the user_id from the function
  };

  // Accept an invitation via email by calling the unified RPC function
  const acceptInvitationByEmail = async (inviteeEmail: string) => {
    const { data, error } = await supabase.rpc('accept_invitation_by_email', { invitee_email: inviteeEmail });
    if (error) {
      throw error;
    }
    return data; // Returns the user_id from the function
  };

  return { acceptInvitation, acceptInvitationByEmail };
}; 