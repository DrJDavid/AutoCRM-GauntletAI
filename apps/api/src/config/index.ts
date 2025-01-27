import { z } from 'zod'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Only require Supabase variables, everything else has defaults
const envSchema = z.object({
  // Required Supabase variables
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Optional with defaults
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  SESSION_SECRET: z.string().default('dev-secret-key'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
})

// Validate environment variables
const envValidation = envSchema.safeParse(process.env)

if (!envValidation.success) {
  console.error('❌ Missing required environment variables:', 
    JSON.stringify(envValidation.error.format(), null, 2))
  process.exit(1)
}

export const config = {
  ...envValidation.data,
  isDev: envValidation.data.NODE_ENV === 'development',
  isProd: envValidation.data.NODE_ENV === 'production',
  isTest: envValidation.data.NODE_ENV === 'test',
}
