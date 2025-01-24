import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from '@/stores/userStore';
import type { Ticket, TicketStatus, TicketPriority, TicketCategory } from '@/types/database';

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
   * Assign the ticket to an agent
   */
  assignTicket: (agentId: string | null) => Promise<void>;
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
        .select(`
          *,
          customer:customer_id (
            id,
            email,
            full_name
          ),
          assigned_agent:assigned_agent_id (
            id,
            email,
            full_name
          ),
          attachments (*)
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Ticket not found');

      // Check if user has access to this ticket
      const hasAccess = 
        currentUser?.id === data.customer_id || // Customer owns the ticket
        (currentUser?.role === 'agent' && currentUser?.organization_id === data.organization_id) || // Agent in same org
        (currentUser?.role === 'admin' && currentUser?.organization_id === data.organization_id); // Admin in same org

      if (!hasAccess) {
        throw new Error('You do not have access to this ticket');
      }

      setTicket(data);
    } catch (err) {
      console.error('Error fetching ticket:', err);
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
        () => {
          fetchTicket();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, options.realtime, currentUser]);

  // Initial fetch
  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  const updateStatus = async (status: TicketStatus) => {
    if (!ticket || !currentUser) {
      console.error('Cannot update status: ticket or user not found', { ticket, currentUser });
      throw new Error('Cannot update status: ticket or user not found');
    }

    console.log('Updating ticket status:', { ticketId, oldStatus: ticket.status, newStatus: status });
    const { data, error } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.error('Error updating ticket status:', { error, ticketId, status });
      throw error;
    }

    console.log('Successfully updated ticket status:', data);
    await fetchTicket();
  };

  const updatePriority = async (priority: TicketPriority) => {
    if (!ticket || !currentUser) {
      console.error('Cannot update priority: ticket or user not found', { ticket, currentUser });
      throw new Error('Cannot update priority: ticket or user not found');
    }

    console.log('Updating ticket priority:', { ticketId, oldPriority: ticket.priority, newPriority: priority });
    const { data, error } = await supabase
      .from('tickets')
      .update({ priority })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.error('Error updating ticket priority:', { error, ticketId, priority });
      throw error;
    }

    console.log('Successfully updated ticket priority:', data);
    await fetchTicket();
  };

  const updateCategory = async (category: TicketCategory) => {
    if (!ticket || !currentUser) {
      console.error('Cannot update category: ticket or user not found', { ticket, currentUser });
      throw new Error('Cannot update category: ticket or user not found');
    }

    console.log('Updating ticket category:', { ticketId, oldCategory: ticket.category, newCategory: category });
    const { data, error } = await supabase
      .from('tickets')
      .update({ category })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.error('Error updating ticket category:', { error, ticketId, category });
      throw error;
    }

    console.log('Successfully updated ticket category:', data);
    await fetchTicket();
  };

  const updateDetails = async (details: { title?: string; description?: string }) => {
    if (!ticket || !currentUser) return;

    // Customers can only update their own tickets
    if (currentUser.role === 'customer' && currentUser.id !== ticket.customer_id) {
      throw new Error('You can only update your own tickets');
    }

    const { error } = await supabase
      .from('tickets')
      .update(details)
      .eq('id', ticketId);

    if (error) throw error;
    await fetchTicket();
  };

  const assignTicket = async (agentId: string | null) => {
    if (!ticket || !currentUser) {
      console.error('Cannot assign ticket: ticket or user not found', { ticket, currentUser });
      throw new Error('Cannot assign ticket: ticket or user not found');
    }

    console.log('Assigning ticket:', { ticketId, agentId });
    const { error } = await supabase
      .from('tickets')
      .update({ assigned_agent_id: agentId })
      .eq('id', ticketId);

    if (error) {
      console.error('Error assigning ticket:', { error, ticketId, agentId });
      throw error;
    }

    console.log('Successfully assigned ticket:', ticketId);
    await fetchTicket();
  };

  return {
    ticket,
    loading,
    error,
    updateStatus,
    updatePriority,
    updateCategory,
    updateDetails,
    assignTicket,
    refresh: fetchTicket,
  };
}
