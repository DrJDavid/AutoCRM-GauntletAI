import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Ticket, TicketFilters } from '@/types';

interface TicketState {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  filters: TicketFilters;
  isLoading: boolean;
  error: Error | null;
  fetchTickets: () => Promise<void>;
  createTicket: (ticket: Partial<Ticket>) => Promise<void>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  setFilters: (filters: TicketFilters) => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
}

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  selectedTicket: null,
  filters: {},
  isLoading: false,
  error: null,

  setFilters: (filters) => set({ filters }),
  setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),

  fetchTickets: async () => {
    set({ isLoading: true });
    try {
      // First get the user's organization relationships
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('customer_organizations')
        .select('organization_id')
        .eq('customer_id', (await supabase.auth.getUser()).data.user?.id);

      if (userOrgsError) throw userOrgsError;

      // Get tickets for all organizations the user is part of
      const orgIds = userOrgs?.map(org => org.organization_id) || [];
      
      let query = supabase.from('tickets').select('*');
      
      if (orgIds.length > 0) {
        query = query.in('organization_id', orgIds);
      }

      const filters = get().filters;

      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters.assignedTo?.length) {
        query = query.in('assignedAgentId', filters.assignedTo);
      }
      if (filters.tags?.length) {
        query = query.contains('tags', filters.tags);
      }

      const { data, error } = await query.order('createdAt', { ascending: false });
      if (error) throw error;

      set({ tickets: data, error: null });
    } catch (error) {
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },

  createTicket: async (ticket) => {
    set({ isLoading: true });
    try {
      // Get user's organization
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('customer_organizations')
        .select('organization_id')
        .eq('customer_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (userOrgsError) throw userOrgsError;

      if (!userOrgs?.organization_id) {
        throw new Error('No organization found. Please contact support.');
      }

      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          ...ticket,
          organization_id: userOrgs.organization_id
        }])
        .select()
        .single();

      if (error) throw error;
      
      set((state) => ({ 
        tickets: [data, ...state.tickets],
        error: null 
      }));
    } catch (error) {
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTicket: async (id, updates) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === id ? data : t)),
        selectedTicket: state.selectedTicket?.id === id ? data : state.selectedTicket,
        error: null
      }));
    } catch (error) {
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTicket: async (id) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        tickets: state.tickets.filter((t) => t.id !== id),
        selectedTicket: state.selectedTicket?.id === id ? null : state.selectedTicket,
        error: null
      }));
    } catch (error) {
      set({ error: error as Error });
    }
  }
}));
