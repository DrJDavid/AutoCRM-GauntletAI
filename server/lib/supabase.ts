import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from the root .env file
dotenv.config({ path: '../../.env' });

const { VITE_SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey } = process.env;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
  );
}

// Admin client with service role - only available on the server
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}); 