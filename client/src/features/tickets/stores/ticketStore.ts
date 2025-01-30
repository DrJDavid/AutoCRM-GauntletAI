import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  Ticket, 
  TicketMessage, 
  TicketFilters, 
  CreateTicketForm,
  UpdateTicketForm,
  DbTicket,
  DbTicketMessage
} from '../types';
import { supabase } from '@/lib/supabase';

interface TicketState {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  messages: TicketMessage[];
  filters: TicketFilters;
  isLoading: boolean;
  error: Error | null;

  // Actions
  fetchTickets: () => Promise<void>;
  fetchTicket: (id: string) => Promise<void>;
  fetchTicketMessages: (ticketId: string) => Promise<void>;
  createTicket: (data: CreateTicketForm) => Promise<void>;
  updateTicket: (id: string, data: UpdateTicketForm) => Promise<void>;
  addMessage: (ticketId: string, message: string, isInternal?: boolean) => Promise<void>;
  setFilters: (filters: TicketFilters) => void;
  reset: () => void;
  deleteTicket: (id: string) => Promise<void>;
}

// Convert database ticket to frontend ticket
const toFrontendTicket = (dbTicket: DbTicket): Ticket => ({
  ...dbTicket,
  status: dbTicket.status || 'open',
  priority: dbTicket.priority || 'medium',
});

// Convert database message to frontend message
const toFrontendMessage = (dbMessage: DbTicketMessage): TicketMessage => ({
  ...dbMessage,
  is_internal: dbMessage.is_internal || false,
});

export const useTicketStore = create<TicketState>()(
  devtools(
    (set, get) => ({
      tickets: [],
      selectedTicket: null,
      messages: [],
      filters: {},
      isLoading: false,
      error: null,

      fetchTickets: async () => {
        set({ isLoading: true });
        try {
          const { data: tickets, error } = await supabase
            .from('tickets')
            .select(`
              *,
              customer:profiles!tickets_customer_id_fkey(*),
              assigned_agent:profiles!tickets_assigned_to_fkey(*)
            `);

          if (error) throw error;
          set({ tickets: tickets.map(toFrontendTicket), error: null });
        } catch (error) {
          set({ error: error as Error });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchTicket: async (id) => {
        set({ isLoading: true });
        try {
          const { data: ticket, error } = await supabase
            .from('tickets')
            .select(`
              *,
              customer:profiles!tickets_customer_id_fkey(*),
              assigned_agent:profiles!tickets_assigned_to_fkey(*)
            `)
            .eq('id', id)
            .single();

          if (error) throw error;
          set({ selectedTicket: toFrontendTicket(ticket), error: null });
        } catch (error) {
          set({ error: error as Error });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchTicketMessages: async (ticketId) => {
        set({ isLoading: true });
        try {
          const { data: messages, error } = await supabase
            .from('ticket_messages')
            .select(`
              *,
              sender:profiles!ticket_messages_sender_id_fkey(*)
            `)
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

          if (error) throw error;
          set({ messages: messages.map(toFrontendMessage), error: null });
        } catch (error) {
          set({ error: error as Error });
        } finally {
          set({ isLoading: false });
        }
      },

      createTicket: async (data) => {
        set({ isLoading: true });
        try {
          const { data: ticket, error } = await supabase
            .from('tickets')
            .insert({
              title: data.title,
              description: data.description,
              priority: data.priority,
              status: 'open',
            })
            .select()
            .single();

          if (error) throw error;
          set((state) => ({ 
            tickets: [...state.tickets, toFrontendTicket(ticket)],
            error: null 
          }));
        } catch (error) {
          set({ error: error as Error });
        } finally {
          set({ isLoading: false });
        }
      },

      updateTicket: async (id, data) => {
        set({ isLoading: true });
        try {
          const { data: ticket, error } = await supabase
            .from('tickets')
            .update(data)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;
          set((state) => ({
            tickets: state.tickets.map((t) => 
              t.id === id ? toFrontendTicket(ticket) : t
            ),
            selectedTicket: state.selectedTicket?.id === id 
              ? toFrontendTicket(ticket) 
              : state.selectedTicket,
            error: null
          }));
        } catch (error) {
          set({ error: error as Error });
        } finally {
          set({ isLoading: false });
        }
      },

      addMessage: async (ticketId, message, isInternal = false) => {
        set({ isLoading: true });
        try {
          const { data: newMessage, error } = await supabase
            .from('ticket_messages')
            .insert({
              ticket_id: ticketId,
              message,
              is_internal: isInternal,
            })
            .select(`
              *,
              sender:profiles!ticket_messages_sender_id_fkey(*)
            `)
            .single();

          if (error) throw error;
          set((state) => ({
            messages: [...state.messages, toFrontendMessage(newMessage)],
            error: null
          }));
        } catch (error) {
          set({ error: error as Error });
        } finally {
          set({ isLoading: false });
        }
      },

      deleteTicket: async (id) => {
        set({ isLoading: true });
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
        } finally {
          set({ isLoading: false });
        }
      },

      setFilters: (filters) => set({ filters }),
      reset: () => set({ 
        tickets: [], 
        selectedTicket: null, 
        messages: [], 
        filters: {},
        error: null 
      }),
    }),
    { name: 'ticket-store' }
  )
); 