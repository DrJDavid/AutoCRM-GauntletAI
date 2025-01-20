import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Ticket, TicketFilters } from '@/types';

interface TicketState {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  filters: TicketFilters;
  isLoading: boolean;
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

  setFilters: (filters) => set({ filters }),
  setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),

  fetchTickets: async () => {
    set({ isLoading: true });
    try {
      let query = supabase.from('tickets').select('*');
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

      set({ tickets: data });
    } finally {
      set({ isLoading: false });
    }
  },

  createTicket: async (ticket) => {
    const { data, error } = await supabase
      .from('tickets')
      .insert([ticket])
      .select()
      .single();

    if (error) throw error;
    
    set((state) => ({
      tickets: [data, ...state.tickets]
    }));
  },

  updateTicket: async (id, updates) => {
    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === id ? data : t)),
      selectedTicket: state.selectedTicket?.id === id ? data : state.selectedTicket
    }));
  },

  deleteTicket: async (id) => {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;

    set((state) => ({
      tickets: state.tickets.filter((t) => t.id !== id),
      selectedTicket: state.selectedTicket?.id === id ? null : state.selectedTicket
    }));
  }
}));
