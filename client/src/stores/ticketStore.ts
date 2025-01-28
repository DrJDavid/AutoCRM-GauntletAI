import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { TicketFilters } from '@/types';
import { useUserStore } from './userStore';
import type { DbTicket, Ticket } from '@/types/database';

interface TicketState {
  tickets: DbTicket[];
  selectedTicket: DbTicket | null;
  filters: {
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
  };
  isLoading: boolean;
  error: Error | null;
  fetchTickets: () => Promise<void>;
  createTicket: (ticket: Partial<Ticket>) => Promise<void>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  setFilters: (filters: TicketFilters) => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
  setupTicketSubscription: () => Promise<void>;
  cleanup: () => void;
}

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  selectedTicket: null,
  filters: {},
  isLoading: false,
  error: null,
  setFilters: (filters: TicketFilters) => set({ filters }),
  setSelectedTicket: (ticket: Ticket | null) => set({ selectedTicket: ticket as DbTicket | null }),

  fetchTickets: async () => {
    set({ isLoading: true, error: null });
    try {
      const { currentUser } = useUserStore.getState();
      
      if (!currentUser?.organization_id) {
        throw new Error('No organization associated with user');
      }

      const { data, error } = await supabase
        .from('tickets')
        .select('*, customer:customer_id(email), assigned_agent:assigned_agent_id(email)')
        .eq('organization_id', currentUser.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ tickets: data, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      console.error('Error fetching tickets:', error);
    }
  },

  setupTicketSubscription: async () => {
    const currentUser = useUserStore.getState().currentUser;
    if (!currentUser) return;

    // Clean up any existing subscription
    get().cleanup();

    // Subscribe to ticket changes
    const ticketSubscription = supabase
      .channel('ticket-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: currentUser.role === 'customer' 
            ? `customer_id=eq.${currentUser.id}`
            : `organization_id=eq.${currentUser.organization_id}`
        },
        () => {
          // Refresh tickets when any change occurs
          get().fetchTickets();
        }
      )
      .subscribe();

    // Store the subscription for cleanup
    (get() as any).subscription = ticketSubscription;
  },

  cleanup: () => {
    const subscription = (get() as any).subscription;
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  },

  createTicket: async (ticket) => {
    try {
      const currentUser = useUserStore.getState().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tickets')
        .insert({
          ...ticket,
          customer_id: currentUser.id,
          organization_id: currentUser.organization_id
        })
        .select()
        .single();

      if (error) throw error;
      
      set(state => ({
        tickets: [data, ...state.tickets],
        selectedTicket: data
      }));
    } catch (error) {
      console.error('Error creating ticket:', error);
      set({ error: error as Error });
    }
  },

  updateTicket: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        tickets: state.tickets.map(t => t.id === id ? data : t),
        selectedTicket: state.selectedTicket?.id === id ? data : state.selectedTicket
      }));
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  },

  deleteTicket: async (id) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        tickets: state.tickets.filter(t => t.id !== id),
        selectedTicket: state.selectedTicket?.id === id ? null : state.selectedTicket
      }));
    } catch (error) {
      console.error('Error deleting ticket:', error);
      throw error;
    }
  }
}));
