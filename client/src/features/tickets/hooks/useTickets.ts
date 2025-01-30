import { useCallback, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '@/types/supabase';
import type { TicketFilters, DbTicket } from '../types';

export const useTickets = () => {
  const supabase = useSupabaseClient<Database>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTickets = useCallback(async (filters?: TicketFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          customer:customer_id(id, email, full_name),
          assigned_to(id, email, full_name)
        `);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }

      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      return data as DbTicket[];
    } catch (err) {
      setError(err as Error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  return {
    fetchTickets,
    isLoading,
    error,
  };
}; 