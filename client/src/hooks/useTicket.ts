import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from '@/stores/userStore';
import type { Ticket, TicketStatus, TicketPriority, TicketCategory } from '@/db/types/database';

interface UseTicketOptions {
  /**
   * Whether to subscribe to real-time updates
   * @default false
   */
  realtime?: boolean;
}

interface UseTicketReturn {
  /**
   * The ticket data
   */
  ticket: Ticket | null;
  /**
   * Whether the ticket is currently loading
   */
  loading: boolean;
  /**
   * Any error that occurred while fetching the ticket
   */
  error: Error | null;
  /**
   * Update the ticket's status
   */
  updateStatus: (status: TicketStatus) => Promise<void>;
  /**
   * Update the ticket's priority
   */
  updatePriority: (priority: TicketPriority) => Promise<void>;
  /**
   * Update the ticket's category
   */
  updateCategory: (category: TicketCategory) => Promise<void>;
  /**
   * Update the ticket's title and description
   */
  updateDetails: (details: { title?: string; description?: string }) => Promise<void>;
  /**
   * Refresh the ticket data
   */
  refresh: () => Promise<void>;
}

/**
 * Hook to manage a single ticket's data and operations
 * @param ticketId - The ID of the ticket to manage
 * @param options - Configuration options
 */
export function useTicket(ticketId: string, options: UseTicketOptions = {}): UseTicketReturn {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentUser } = useUserStore();

  // Fetch ticket data
  const fetchTicket = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('tickets')
        .select('*, customer:customer_id(*), assigned_agent:assigned_agent_id(*), attachments(*)')
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Ticket not found');

      // Check if user has access to this ticket
      if (data.customer_id !== currentUser?.id && data.organization_id !== currentUser?.organization_id) {
        throw new Error('You do not have access to this ticket');
      }

      setTicket(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch ticket'));
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!options.realtime || !ticketId || !currentUser) return;

    const channel = supabase
      .channel(`ticket:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setTicket(null);
          } else {
            fetchTicket();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, currentUser, options.realtime]);

  // Initial fetch
  useEffect(() => {
    if (!ticketId || !currentUser) return;
    fetchTicket();
  }, [ticketId, currentUser]);

  const updateStatus = async (status: TicketStatus) => {
    if (!ticket || !currentUser) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticket.id)
        .eq('organization_id', currentUser.organization_id);

      if (error) throw error;
      await fetchTicket();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update status');
    }
  };

  const updatePriority = async (priority: TicketPriority) => {
    if (!ticket || !currentUser) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ priority })
        .eq('id', ticket.id)
        .eq('organization_id', currentUser.organization_id);

      if (error) throw error;
      await fetchTicket();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update priority');
    }
  };

  const updateCategory = async (category: TicketCategory) => {
    if (!ticket || !currentUser) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ category })
        .eq('id', ticket.id)
        .eq('organization_id', currentUser.organization_id);

      if (error) throw error;
      await fetchTicket();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update category');
    }
  };

  const updateDetails = async (details: { title?: string; description?: string }) => {
    if (!ticket || !currentUser) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update(details)
        .eq('id', ticket.id)
        .eq('organization_id', currentUser.organization_id);

      if (error) throw error;
      await fetchTicket();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update details');
    }
  };

  return {
    ticket,
    loading,
    error,
    updateStatus,
    updatePriority,
    updateCategory,
    updateDetails,
    refresh: fetchTicket,
  };
}
