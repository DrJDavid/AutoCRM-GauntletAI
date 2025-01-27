import { supabase } from '@/lib/supabase';

interface CreateInviteParams {
  email: string;
  organizationId: string;
  message?: string;
}

interface AcceptInviteParams {
  token: string;
  type: 'agent' | 'customer';
  password: string;
}

interface InviteResponse {
  success: boolean;
  data?: any;
  error?: string;
}

const BASE_URL = process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : '';

export const inviteService = {
  // Create an agent invite
  async createAgentInvite({ email, organizationId, message }: CreateInviteParams): Promise<InviteResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/invites/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, organizationId, message }),
      });

      const result = await response.json();
      console.log('Agent invite response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create agent invite');
      }

      return result;
    } catch (error) {
      console.error('Agent invite error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  },

  // Create a customer invite
  async createCustomerInvite({ email, organizationId, message }: CreateInviteParams): Promise<InviteResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/invites/customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, organizationId, message }),
      });

      const result = await response.json();
      console.log('Customer invite response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create customer invite');
      }

      return result;
    } catch (error) {
      console.error('Customer invite error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  },

  // Check invite status
  async checkInvite(token: string, type: 'agent' | 'customer'): Promise<InviteResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/invites/check/${token}?type=${type}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('Check invite response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check invite');
      }

      return result;
    } catch (error) {
      console.error('Check invite error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  },

  // Accept invite
  async acceptInvite({ token, type, password }: AcceptInviteParams): Promise<InviteResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/invites/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, type, password }),
      });

      const result = await response.json();
      console.log('Accept invite response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept invite');
      }

      return result;
    } catch (error) {
      console.error('Accept invite error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  },
};
