import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/db/types/database';

// Initialize Supabase client
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
