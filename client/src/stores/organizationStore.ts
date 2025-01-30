import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
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
  settings: Record<string, any>;
  metadata: Record<string, any>;
  is_active: boolean;
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
        .eq('is_active', true)
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
        .eq('is_active', true);

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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-organization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create organization');
      }

      set({ 
        organization: result.data.organization,
        loading: false 
      });

      return {
        organizationId: result.data.organizationId,
        adminId: result.data.adminId
      };
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
