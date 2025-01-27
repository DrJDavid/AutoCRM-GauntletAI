import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

// Initialize the Supabase client with type safety
export const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

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
