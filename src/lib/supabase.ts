import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const useLocal = process.env.NEXT_PUBLIC_USE_LOCAL_SUPABASE === 'true';

const supabaseUrl = useLocal
  ? process.env.NEXT_PUBLIC_LOCAL_SUPABASE_URL
  : process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey = useLocal
  ? process.env.NEXT_PUBLIC_LOCAL_SUPABASE_ANON_KEY
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize the Supabase client with type safety
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper function to handle Supabase errors consistently
export const handleSupabaseError = (error: unknown) => {
  // Log the error for debugging
  console.error('Supabase operation failed:', error);

  // Return a user-friendly error message
  return {
    message: 'An error occurred while processing your request',
    details: process.env.NODE_ENV === 'development' ? error : undefined,
  };
};

// Type-safe wrapper for Supabase operations
export const safeQuery = async <T>(
  operation: Promise<{ data: T | null; error: unknown }>
) => {
  try {
    const { data, error } = await operation;
    if (error) throw error;
    return { data: data as T, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// Helper to check if we're using local Supabase
export const isLocalSupabase = () => useLocal;
