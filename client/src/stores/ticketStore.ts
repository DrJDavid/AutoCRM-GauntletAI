import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useUserStore } from './userStore';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  customer?: Database['public']['Tables']['profiles']['Row'] | null;
};
type TicketMessage = Database['public']['Tables']['ticket_messages']['Row'];
type TicketStatus = Database['public']['Enums']['ticket_status'];
type TicketPriority = Database['public']['Enums']['ticket_priority'];

interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
}

interface TicketState {
  tickets: Ticket[];
  messages: TicketMessage[];
  selectedTicket: Ticket | null;
  filters: TicketFilters;
  isLoading: boolean;
  error: Error | null;
  subscription: (() => void) | null;
  fetchTickets: () => Promise<void>;
  fetchTicket: (id: string) => Promise<void>;
  createTicket: (ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  setFilters: (filters: TicketFilters) => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
  fetchMessages: (ticketId: string) => Promise<void>;
  addMessage: (message: Omit<TicketMessage, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  setupTicketSubscription: () => () => void;
  cleanup: () => void;
  getTicketById: (id: string) => Promise<Ticket>;
  updateTicketInStore: (ticket: Ticket) => void;
  removeTicketFromStore: (ticketId: string) => void;
  addTicketToStore: (ticket: Ticket) => void;
}

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  messages: [],
  selectedTicket: null,
  filters: {},
  isLoading: false,
  error: null,
  subscription: null,
  
  // Store update methods
  updateTicketInStore: (ticket: Ticket) => {
    set((state) => ({
      tickets: state.tickets.map(t => t.id === ticket.id ? ticket : t),
      selectedTicket: state.selectedTicket?.id === ticket.id ? ticket : state.selectedTicket
    }));
  },

  removeTicketFromStore: (ticketId: string) => {
    set((state) => ({
      tickets: state.tickets.filter(t => t.id !== ticketId),
      selectedTicket: state.selectedTicket?.id === ticketId ? null : state.selectedTicket
    }));
  },

  addTicketToStore: (ticket: Ticket) => {
    set((state) => ({
      tickets: [ticket, ...state.tickets]
    }));
  },

  setFilters: (filters: TicketFilters) => set({ filters }),
  setSelectedTicket: (ticket: Ticket | null) => set({ selectedTicket: ticket }),

  fetchTickets: async () => {
    set({ isLoading: true });
    try {
      const currentUser = useUserStore.getState().currentUser;
      if (!currentUser?.organization_id) {
        throw new Error('No organization ID found');
      }

      const { data, error } = await supabase
        .from('tickets')
        .select('*, customer:customer_id(*)')
        .eq('organization_id', currentUser.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ tickets: data || [] });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTicket: async (id) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        set((state) => ({
          selectedTicket: data,
          tickets: state.tickets.some(t => t.id === id)
            ? state.tickets.map(t => t.id === id ? data : t)
            : [...state.tickets, data]
        }));
      }
    } catch (error) {
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },

  createTicket: async (ticket) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([ticket])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        set((state) => ({ tickets: [data, ...state.tickets] }));
      }
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
      if (data) {
        set((state) => ({
          tickets: state.tickets.map(t => t.id === id ? data : t),
          selectedTicket: state.selectedTicket?.id === id ? data : state.selectedTicket
        }));
      }
    } catch (error) {
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (ticketId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ messages: data || [] });
    } catch (error) {
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },

  addMessage: async (message) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .insert([message])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        set((state) => ({ messages: [...state.messages, data] }));
      }
    } catch (error) {
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
    }
  },

  setupTicketSubscription: () => {
    // Clean up existing subscription if any
    const currentSubscription = get().subscription;
    if (currentSubscription) {
      currentSubscription();
    }

    const subscription = supabase
      .channel('tickets-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        async (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          const state = get();

          switch (eventType) {
            case 'INSERT':
              get().addTicketToStore(newRecord as Ticket);
              break;
            case 'UPDATE':
              get().updateTicketInStore(newRecord as Ticket);
              break;
            case 'DELETE':
              get().removeTicketFromStore((oldRecord as Ticket).id);
              break;
          }
        }
      )
      .subscribe();

    const cleanup = () => {
      subscription.unsubscribe();
    };

    set({ subscription: cleanup });
    return cleanup;
  },

  cleanup: () => {
    const currentSubscription = get().subscription;
    if (currentSubscription) {
      currentSubscription();
      set({ subscription: null });
    }
  },

  getTicketById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          customer:customer_id(email),
          assigned_agent:assigned_to(email),
          messages:ticket_messages(
            *,
            sender:sender_id(email)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      set({ selectedTicket: data, isLoading: false });
      return data;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  }
}));
