# Database Types Documentation

This directory contains TypeScript type definitions for our Supabase database schema. These types ensure type safety when interacting with the database through the Supabase client.

## Table of Contents

- [Overview](#overview)
- [Usage Examples](#usage-examples)
  - [In Components](#in-components)
  - [In Stores](#in-stores)
  - [With Supabase Queries](#with-supabase-queries)
- [Type Categories](#type-categories)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

## Overview

The `database.ts` file contains TypeScript interfaces and types that mirror our Supabase database schema. These types are automatically generated from our database schema using the Supabase CLI command:

```bash
npx supabase gen types typescript
```

## Usage Examples

### In Components

```typescript
import { Ticket, TicketStatus, TicketPriority } from '@/types/database';

// Using types in state
const [tickets, setTickets] = useState<Ticket[]>([]);
const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

// Type-safe ticket creation
const createTicket = (data: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>) => {
  // TypeScript will ensure all required fields are present
};

// Using enum-like types
const isPriorityHigh = (priority: TicketPriority) => priority === 'high';
const isTicketClosed = (status: TicketStatus) => status === 'closed';
```

### In Stores

```typescript
import { Ticket, Profile } from '@/types/database';
import { create } from 'zustand';

interface TicketStore {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  assignedAgent: Profile | null;
  setTickets: (tickets: Ticket[]) => void;
  assignTicket: (ticketId: string, agentId: string) => Promise<void>;
}

const useTicketStore = create<TicketStore>((set) => ({
  tickets: [],
  selectedTicket: null,
  assignedAgent: null,
  setTickets: (tickets) => set({ tickets }),
  assignTicket: async (ticketId, agentId) => {
    // Type-safe update
  },
}));
```

### With Supabase Queries

```typescript
import { supabase } from '@/lib/supabaseClient';
import { Ticket, TicketMessage } from '@/types/database';

// Fetching a ticket with type safety
const fetchTicket = async (id: string) => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();
  
  return { ticket: data as Ticket, error };
};

// Fetching related data
const fetchTicketWithMessages = async (id: string) => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      messages:ticket_messages(*)
    `)
    .eq('id', id)
    .single();
  
  return {
    ticket: data as Ticket & { messages: TicketMessage[] },
    error
  };
};
```

## Type Categories

### Organization Types
- `Organization`: Core organization data
- `OrganizationMember`: Organization member data

### User Types
- `Profile`: User profile information

### Team Types
- `Team`: Team data
- `TeamMember`: Team member data

### Ticket Types
- `Ticket`: Core ticket data
- `TicketMessage`: Messages in tickets
- `TicketComment`: Comments on tickets
- `TicketPriority`: 'low' | 'medium' | 'high' | 'urgent'
- `TicketStatus`: 'open' | 'in_progress' | 'resolved' | 'closed'

### Attachment Types
- `Attachment`: File attachments

### Knowledge Base Types
- `KnowledgeArticle`: Knowledge base articles

### Analytics Types
- `AgentPerformance`: Agent metrics
- `TeamPerformance`: Team metrics
- `TicketStats`: Ticket statistics

### Invitation Types
- `AgentOrganizationInvite`: Agent invites
- `CustomerOrganizationInvite`: Customer invites

## Best Practices

1. **Always Use Type Annotations**
   ```typescript
   // Good
   const ticket: Ticket = await fetchTicket(id);
   
   // Avoid
   const ticket = await fetchTicket(id);
   ```

2. **Use Partial for Updates**
   ```typescript
   // When updating a ticket
   const updateTicket = async (id: string, data: Partial<Ticket>) => {
     await supabase.from('tickets').update(data).eq('id', id);
   };
   ```

3. **Use Pick/Omit for Form Data**
   ```typescript
   // When creating a new ticket
   type NewTicketForm = Omit<Ticket, 'id' | 'created_at' | 'updated_at'>;
   
   // When only need specific fields
   type TicketSummary = Pick<Ticket, 'id' | 'title' | 'status'>;
   ```

4. **Type Guard Functions**
   ```typescript
   const isTicket = (obj: any): obj is Ticket => {
     return 'id' in obj && 'title' in obj && 'status' in obj;
   };
   ```

## Common Patterns

### Working with JSON Fields
```typescript
// Typing JSON metadata
interface TicketMetadata {
  browser?: string;
  os?: string;
  customFields?: Record<string, string>;
}

const ticket: Ticket = {
  // ...other fields
  metadata: {
    browser: 'Chrome',
    os: 'Windows',
    customFields: {
      department: 'Sales'
    }
  } as TicketMetadata
};
```

### Handling Related Data
```typescript
// Type for ticket with related data
interface TicketWithRelations extends Ticket {
  customer: Profile;
  assigned_agent: Profile | null;
  messages: TicketMessage[];
  comments: TicketComment[];
}

// Fetching related data
const fetchTicketWithRelations = async (id: string) => {
  const { data } = await supabase
    .from('tickets')
    .select(`
      *,
      customer:profiles!tickets_customer_id_fkey(*),
      assigned_agent:profiles!tickets_assigned_agent_id_fkey(*),
      messages:ticket_messages(*),
      comments:ticket_comments(*)
    `)
    .eq('id', id)
    .single();

  return data as TicketWithRelations;
};
```

Remember to keep this documentation updated whenever you make changes to the database schema or generate new types using the Supabase CLI.
