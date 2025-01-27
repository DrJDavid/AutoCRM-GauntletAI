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
    set({ isLoading: true });
    try {
      const currentUser = useUserStore.getState().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      let query = supabase
        .from('tickets')
        .select(`
          *,
          customer:customer_id (email, full_name),
          assigned_agent:assigned_agent_id (email, full_name),
          ticket_attachments (id, file_path, uploaded_by, created_at)
        `);

      // Filter based on user role
      if (currentUser.role === 'customer') {
        // Customers see their own tickets
        query = query.eq('customer_id', currentUser.id);
      } else if (currentUser.role === 'agent' || currentUser.role === 'admin') {
        // Agents and admins see tickets from their organization
        query = query.eq('organization_id', currentUser.organization_id);
      }

      const filters = get().filters;
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters.assignedTo?.length) {
        query = query.in('assigned_agent_id', filters.assignedTo);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      set({ tickets: data || [], error: null });
      
      // Update selected ticket if it exists in the new data
      const selectedTicket = get().selectedTicket;
      if (selectedTicket) {
        const updatedSelectedTicket = data?.find(t => t.id === selectedTicket.id);
        if (updatedSelectedTicket) {
          set({ selectedTicket: updatedSelectedTicket });
        }
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
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
