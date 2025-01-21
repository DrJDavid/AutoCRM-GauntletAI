import { createClient } from '@supabase/supabase-js';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const subscribeToTickets = (callback: (payload: any) => void) => {
  const channel = supabase
    .channel('tickets')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tickets' },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
