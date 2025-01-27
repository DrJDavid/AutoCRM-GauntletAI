import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: process.env.NODE_ENV === 'production',
  external: [
    'express',
    'winston',
    '@supabase/supabase-js',
    'zod',
    'cors',
    'helmet',
    'express-session',
    'memorystore',
    'passport',
    'passport-local',
    'express-rate-limit'
  ]
})
