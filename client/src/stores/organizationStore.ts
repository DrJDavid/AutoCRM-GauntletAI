import { create, StateCreator } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { DbOrganization, DbProfile, Json } from '@/types/database';

interface OrganizationState {
  organization: DbOrganization | null;
  members: DbProfile[];
  isLoading: boolean;
  error: Error | null;
  settings: OrganizationSettings;
  businessHours: BusinessHours[];
  holidays: Holiday[];
}

interface BusinessHours {
  dayOfWeek: number;
  open: string;
  close: string;
  timezone: string;
}

interface Holiday {
  date: string;
  name: string;
  isRecurring: boolean;
}

interface OrganizationSettings {
  supportEmail: string;
  billingEmail?: string;
  timezone: string;
  businessHours: {
    regularHours: Record<string, Array<{ open: string; close: string }>>;
    holidays: Holiday[];
  };
  ticketSettings: {
    autoAssignment: boolean;
    defaultPriority: string;
    allowCustomerPriority: boolean;
  };
  chatSettings?: {
    enabled: boolean;
    operatingHours: {
      inheritBusinessHours: boolean;
      customHours?: Record<string, Array<{ open: string; close: string }>>;
    };
  };
  metadata?: Json;
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

type OrganizationStoreState = {
  organization: DbOrganization | null;
  loading: boolean;
  error: string | null;
};

type OrganizationStoreActions = {
  loadOrganization: (id: string) => Promise<void>;
  updateOrganization: (updates: Partial<DbOrganization>) => Promise<void>;
  createOrganization: (data: CreateOrganizationData) => Promise<{ 
    organizationId: string; 
    adminId: string;
    slug: string;
    session: any;
  }>;
  isBusinessHours: () => boolean;
  isChatAvailable: () => boolean;
};

type OrganizationStore = OrganizationStoreState & OrganizationStoreActions;

function isOrganizationSettings(settings: unknown): settings is OrganizationSettings {
  if (!settings || typeof settings !== 'object') return false;
  const s = settings as any;
  return (
    typeof s.supportEmail === 'string' &&
    typeof s.timezone === 'string' &&
    typeof s.businessHours === 'object' &&
    typeof s.ticketSettings === 'object'
  );
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

  updateOrganization: async (updates: Partial<DbOrganization>) => {
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
      // Create organization through Edge Function
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

      // Sign in with the newly created account
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.adminEmail,
        password: data.adminPassword,
      });

      if (signInError) {
        throw new Error('Organization created but failed to sign in. Please try logging in manually.');
      }

      // Load the organization data
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', result.data.organizationId)
        .single();

      if (orgError) {
        throw new Error('Failed to load organization data');
      }

      // Store the complete organization data
      set({ 
        organization: orgData,
        loading: false 
      });

      return {
        organizationId: result.data.organizationId,
        adminId: result.data.adminId,
        slug: orgData.slug,
        session: authData.session
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
    if (!organization?.settings || !isOrganizationSettings(organization.settings)) return false;

    const settings = organization.settings;
    const now = new Date();
    const day = now.getDay();
    const time = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    // Check if it's a holiday
    const today = now.toISOString().split('T')[0];
    const isHoliday = settings.businessHours.holidays.some(
      (holiday: Holiday) => holiday.date === today
    );
    if (isHoliday) return false;

    // Check regular hours
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayHours = settings.businessHours.regularHours[dayNames[day]];
    if (!dayHours?.length) return false;

    return dayHours.some(({ open, close }: { open: string; close: string }) => {
      return time >= open && time <= close;
    });
  },

  isChatAvailable: () => {
    const { organization } = get();
    if (!organization?.settings || !isOrganizationSettings(organization.settings)) return false;

    const settings = organization.settings;
    if (!settings.chatSettings?.enabled) return false;

    // If using custom hours, check those
    if (!settings.chatSettings.operatingHours.inheritBusinessHours && 
        settings.chatSettings.operatingHours.customHours) {
      // Similar logic to isBusinessHours but using custom hours
      return true; // Implement custom hours check
    }

    // Otherwise use regular business hours
    return get().isBusinessHours();
  },
}));
