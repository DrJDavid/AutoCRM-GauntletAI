import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { TicketFilters, Ticket } from '@/types';
import { useUserStore } from './userStore';

interface TicketState {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
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
  setSelectedTicket: (ticket: Ticket | null) => set({ selectedTicket: ticket }),

  fetchTickets: async () => {
    set({ isLoading: true, error: null });
    try {
      const { currentUser } = useUserStore.getState();
      
      if (!currentUser?.organization_id) {
        throw new Error('No organization associated with user');
      }

      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          customer:customer_id(email),
          assigned_agent:assigned_agent_id(email)
        `)
        .eq('organization_id', currentUser.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Ticket type
      const tickets = data.map(ticket => ({
        ...ticket,
        description: ticket.current_description,
      }));

      set({ tickets, isLoading: false });
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
          current_description: ticket.description,
          customer_id: currentUser.id,
          organization_id: currentUser.organization_id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Transform the data to match our Ticket type
      const newTicket = {
        ...data,
        description: data.current_description,
      };

      set(state => ({
        tickets: [newTicket, ...state.tickets],
        selectedTicket: newTicket
      }));
    } catch (error) {
      console.error('Error creating ticket:', error);
      set({ error: error as Error });
    }
  },

  updateTicket: async (id, updates) => {
    try {
      const dbUpdates = {
        ...updates,
        current_description: updates.description,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tickets')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Transform the data to match our Ticket type
      const updatedTicket = {
        ...data,
        description: data.current_description,
      };

      set(state => ({
        tickets: state.tickets.map(t => t.id === id ? updatedTicket : t),
        selectedTicket: state.selectedTicket?.id === id ? updatedTicket : state.selectedTicket
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
