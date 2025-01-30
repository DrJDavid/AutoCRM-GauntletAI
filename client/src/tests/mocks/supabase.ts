import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;
type Row<T extends TableName> = Tables[T]['Row'];

type MockDataStore = {
  tickets: Tables['tickets']['Row'][];
  ticket_messages: Tables['ticket_messages']['Row'][];
  profiles: Tables['profiles']['Row'][];
  organizations: Tables['organizations']['Row'][];
  ai_agent_assignments: Tables['ai_agent_assignments']['Row'][];
  ai_agent_responses: Tables['ai_agent_responses']['Row'][];
  ai_agents: Tables['ai_agents']['Row'][];
  invitations: Tables['invitations']['Row'][];
  ticket_attachments: Tables['ticket_attachments']['Row'][];
};

// Mock data store
let mockData: MockDataStore = {
  tickets: [],
  ticket_messages: [],
  profiles: [
    {
      id: 'customer-id',
      email: 'test.customer@customer.com',
      role: 'customer',
      organization_id: 'org-id',
      created_at: new Date().toISOString(),
      is_active: true,
      first_name: 'Test',
      last_name: 'Customer',
      avatar_url: null,
      department: null,
      last_seen_at: null,
      metadata: null,
      phone: null,
      title: null,
      updated_at: null
    },
    {
      id: 'agent-id',
      email: 'test.agent@acme-corp.com',
      role: 'agent',
      organization_id: 'org-id',
      created_at: new Date().toISOString(),
      is_active: true,
      first_name: 'Test',
      last_name: 'Agent',
      avatar_url: null,
      department: null,
      last_seen_at: null,
      metadata: null,
      phone: null,
      title: null,
      updated_at: null
    },
    {
      id: 'admin-id',
      email: 'test.admin@acme-corp.com',
      role: 'admin',
      organization_id: 'org-id',
      created_at: new Date().toISOString(),
      is_active: true,
      first_name: 'Test',
      last_name: 'Admin',
      avatar_url: null,
      department: null,
      last_seen_at: null,
      metadata: null,
      phone: null,
      title: null,
      updated_at: null
    }
  ],
  organizations: [
    {
      id: 'org-id',
      name: 'Acme Corporation',
      slug: 'acme-corp',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {},
      settings: {},
      is_active: true
    }
  ],
  ai_agent_assignments: [],
  ai_agent_responses: [],
  ai_agents: [],
  invitations: [],
  ticket_attachments: []
};

// Helper function to resolve foreign key relationships
function resolveRelations<T extends TableName>(
  table: T,
  item: Row<T>,
  relations: string
): Row<T> & Record<string, any> {
  const result = { ...item } as Row<T> & Record<string, any>;
  
  // Parse relations string for foreign key lookups
  const relationMatches = relations.match(/([^,\s]+):([^(]+)\(([^)]+)\)/g) || [];
  
  for (const match of relationMatches) {
    const [alias, relatedTable, fields] = match.split(/:|[()]/).filter(Boolean);
    
    if (relatedTable.startsWith('profiles!tickets_')) {
      // Handle profile foreign key relationships
      const fkField = relatedTable === 'profiles!tickets_customer_id_fkey' 
        ? 'customer_id'
        : relatedTable === 'profiles!tickets_assigned_to_fkey'
        ? 'assigned_to'
        : null;
      
      if (fkField) {
        const profile = mockData.profiles.find(p => p.id === (result as any)[fkField]);
        result[alias] = profile || null;
      }
    } else if (relatedTable === 'ticket_messages') {
      // Handle ticket messages relationship
      result[alias] = mockData.ticket_messages.filter(
        m => m.ticket_id === item.id
      );
    }
  }
  
  return result;
}

// Create a mock Supabase client
export const mockSupabase = {
  from: <T extends TableName>(table: T) => ({
    select: (query = '*') => ({
      eq: (column: keyof Row<T>, value: any) => ({
        single: async () => {
          const items = mockData[table] as Row<T>[];
          const item = items.find(item => item[column] === value);
          const data = item ? resolveRelations(table, item, query) : null;
          return { data, error: null };
        },
        in: (values: any[]) => ({
          data: (mockData[table] as Row<T>[])
            .filter(item => values.includes(item[column]))
            .map(item => resolveRelations(table, item, query)),
          error: null
        })
      }),
      data: (mockData[table] as Row<T>[])
        .map(item => resolveRelations(table, item, query)),
      error: null
    }),
    insert: (values: Partial<Row<T>>) => ({
      select: (query = '*') => ({
        single: async () => {
          const newItem = {
            id: `mock-${Date.now()}`,
            created_at: new Date().toISOString(),
            ...values
          } as Row<T>;
          (mockData[table] as Row<T>[]).push(newItem);
          const data = resolveRelations(table, newItem, query);
          return { data, error: null };
        }
      })
    }),
    update: (values: Partial<Row<T>>) => ({
      eq: (column: keyof Row<T>, value: any) => ({
        select: (query = '*') => ({
          single: async () => {
            const items = mockData[table] as Row<T>[];
            const index = items.findIndex(item => item[column] === value);
            if (index === -1) return { data: null, error: new Error('Not found') };
            
            const updatedItem = {
              ...items[index],
              ...values,
              updated_at: new Date().toISOString()
            } as Row<T>;
            items[index] = updatedItem;
            const data = resolveRelations(table, updatedItem, query);
            return { data, error: null };
          }
        })
      })
    }),
    delete: () => ({
      eq: (column: keyof Row<T>, value: any) => ({
        async execute() {
          const items = mockData[table] as Row<T>[];
          const index = items.findIndex(item => item[column] === value);
          if (index !== -1) {
            items.splice(index, 1);
          }
          return { error: null };
        }
      }),
      in: (column: keyof Row<T>, values: any[]) => ({
        async execute() {
          const items = mockData[table] as Row<T>[];
          mockData[table] = items.filter(
            item => !values.includes(item[column])
          ) as MockDataStore[T];
          return { error: null };
        }
      })
    })
  }),
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      // Find user by email
      const user = mockData.profiles.find(p => p.email === email);
      
      // For test users, accept any password that matches the pattern
      const isTestPassword = password === 'testpass123!' || password.startsWith('test');
      const isTestEmail = email.includes('@acme-corp.com') || email.includes('@customer.com');
      
      if (user && (isTestPassword || isTestEmail)) {
        return {
          data: {
            session: {
              access_token: 'mock-token',
              refresh_token: 'mock-refresh-token',
              user: {
                id: user.id,
                email: user.email,
                role: user.role,
                organization_id: user.organization_id
              }
            }
          },
          error: null
        };
      }
      return {
        data: { session: null },
        error: new Error('Invalid credentials')
      };
    },
    signOut: async () => ({ error: null })
  }
} as unknown as ReturnType<typeof createClient<Database>>;

// Helper to reset mock data
export function resetMockData() {
  mockData = {
    tickets: [],
    ticket_messages: [],
    profiles: [...mockData.profiles],
    organizations: [],
    ai_agent_assignments: [],
    ai_agent_responses: [],
    ai_agents: [],
    invitations: [],
    ticket_attachments: []
  };
}

// Export the mock client
export const supabase = mockSupabase; 