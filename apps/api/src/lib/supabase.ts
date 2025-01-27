import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Load environment variables from the client/.env file
// dotenv.config({ path: './client/.env' });

// const { VITE_SUPABASE_URL: supabaseUrl, VITE_SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey } = process.env;

// if (!supabaseUrl || !supabaseServiceKey) {
//   throw new Error(
//     'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set.'
//   );
// }

// Admin client with service role - only available on the server
export const supabaseAdmin = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }); 