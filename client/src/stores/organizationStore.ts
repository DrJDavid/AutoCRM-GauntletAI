import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

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

interface OrganizationStore {
  organization: Organization | null;
  loading: boolean;
  error: string | null;
  loadOrganization: (id: string) => Promise<void>;
  updateOrganization: (updates: Partial<Organization>) => Promise<void>;
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
        .update(updates)
        .eq('id', organization.id);

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
