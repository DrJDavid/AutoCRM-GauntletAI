import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.test' })

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signIn: vi.fn(),
      signOut: vi.fn(),
      session: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }))
  }))
}))

beforeAll(() => {
  // Setup any test database or global test state
})

afterEach(() => {
  // Clean up after each test
  vi.clearAllMocks()
})

afterAll(() => {
  // Clean up any test resources
})
