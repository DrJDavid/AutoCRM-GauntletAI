import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';
import type { UserRole } from '@/db/types/database';

interface BusinessHours {
  timezone: string;
  regular_hours: {
    [key: string]: Array<{ open: string; close: string }>;
  };
  holidays: Array<{
    date: string;
    name: string;
    closed: boolean;
  }>;
}

interface PhoneNumber {
  label: string;
  number: string;
  hours: string;
}

interface ContactEmail {
  label: string;
  email: string;
}

interface PhysicalAddress {
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  business_hours: BusinessHours;
  phone_numbers: PhoneNumber[];
  contact_emails: ContactEmail[];
  physical_addresses: PhysicalAddress[];
  support_channels: {
    email: { enabled: boolean };
    phone: { enabled: boolean };
    chat: { enabled: boolean };
    ticket: { enabled: boolean };
  };
  chat_settings: {
    enabled: boolean;
    operating_hours: {
      inherit_business_hours: boolean;
      custom_hours?: BusinessHours;
    };
    queue_settings: {
      max_queue_size: number;
      max_wait_time: number;
    };
    auto_responses: {
      welcome: string;
      offline: string;
      queue: string;
    };
    routing: {
      method: 'round_robin' | 'least_busy' | 'manual';
      fallback_agent_id: string | null;
    };
  };
}

interface CreateOrganizationData {
  name: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
}

interface OrganizationStore {
  organization: Organization | null;
  loading: boolean;
  error: string | null;
  loadOrganization: (id: string) => Promise<void>;
  updateOrganization: (updates: Partial<Organization>) => Promise<void>;
  createOrganization: (data: CreateOrganizationData) => Promise<{ organizationId: string; adminId: string }>;
  isBusinessHours: () => boolean;
  isChatAvailable: () => boolean;
}

export const useOrganizationStore = create<OrganizationStore>((set, get) => ({
  organization: null,
  loading: false,
  error: null,

  loadOrganization: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      set({ organization: data, loading: false });
    } catch (error) {
      console.error('Error loading organization:', error);
      set({
        error: 'Failed to load organization',
        loading: false,
      });
    }
  },

  updateOrganization: async (updates: Partial<Organization>) => {
    const { organization } = get();
    if (!organization) return;

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', organization.id)
        .eq('is_deleted', false);

      if (error) throw error;

      set({
        organization: { ...organization, ...updates },
        loading: false,
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      set({
        error: 'Failed to update organization',
        loading: false,
      });
    }
  },

  createOrganization: async (data: CreateOrganizationData) => {
    set({ loading: true, error: null });
    
    try {
      // Check if organization with slug already exists
      const { data: existingOrgs, error: slugError } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', data.slug)
        .eq('is_deleted', false);

      if (slugError) throw slugError;
      if (existingOrgs && existingOrgs.length > 0) {
        throw new Error(`Organization with slug "${data.slug}" already exists. Please choose a different slug.`);
      }

      // Sign up the user first using Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.adminEmail,
        password: data.adminPassword,
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create user account');

      // Create the organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([
          {
            name: data.name,
            slug: data.slug,
            is_deleted: false
          }
        ])
        .select()
        .single();

      if (orgError) {
        console.error('Organization creation error:', orgError);
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }

      // Create the admin profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: data.adminEmail,
            role: 'head_admin',
            organization_id: orgData.id,
            is_head_admin: true,
            is_deleted: false
          }
        ])
        .select()
        .single();

      if (profileError) {
        // If profile creation fails, cleanup
        await supabase.from('organizations').delete().eq('id', orgData.id);
        throw new Error(`Failed to create admin profile: ${profileError.message}`);
      }

      // Set the user store with the new profile
      const userStore = useUserStore.getState();
      userStore.currentUser = {
        ...profileData,
        organization: orgData
      };
      userStore.isAuthenticated = true;
      userStore.isLoading = false;
      userStore.error = null;

      set({ organization: orgData, loading: false });
      return { organizationId: orgData.id, adminId: authData.user.id };
    } catch (error) {
      console.error('Error creating organization:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create organization',
        loading: false,
      });
      throw error;
    }
  },

  isBusinessHours: () => {
    const { organization } = get();
    if (!organization) return false;

    const now = new Date();
    const day = now.toLocaleLowerCase().slice(0, 3);
    const time = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    // Check if it's a holiday
    const today = now.toISOString().split('T')[0];
    const isHoliday = organization.business_hours.holidays.some(
      (holiday) => holiday.date === today && holiday.closed
    );
    if (isHoliday) return false;

    // Check regular hours
    const dayHours = organization.business_hours.regular_hours[day];
    if (!dayHours?.length) return false;

    return dayHours.some(({ open, close }) => {
      return time >= open && time <= close;
    });
  },

  isChatAvailable: () => {
    const { organization } = get();
    if (!organization) return false;

    const {
      chat_settings: { enabled, operating_hours },
    } = organization;

    if (!enabled) return false;

    // If using custom hours, check those
    if (!operating_hours.inherit_business_hours && operating_hours.custom_hours) {
      // Similar logic to isBusinessHours but using custom_hours
      return true; // Implement custom hours check
    }

    // Otherwise use regular business hours
    return get().isBusinessHours();
  },
}));
