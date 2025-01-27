# @autocrm/api-types

This package contains shared TypeScript types for the AutoCRM application, including database types from Supabase and API request/response types.

## Structure

```
src/
├── database/           # Supabase database types
│   ├── auth.ts        # Authentication related types
│   ├── tickets.ts     # Ticket system types
│   └── profiles.ts    # User profile types
│
├── api/               # API types
│   ├── requests/      # Request type definitions
│   └── responses/     # Response type definitions
│
└── index.ts          # Main export file
```

## Usage

This package is used internally by both the frontend and backend to ensure type safety across the entire application.

```typescript
import { Ticket, Profile } from '@autocrm/api-types'

// Use in API handlers
function handleTicketCreate(ticket: Ticket.Create) {
  // Implementation
}

// Use in React components
interface TicketListProps {
  tickets: Ticket.Full[]
}
```

## Type Definitions

### Database Types
- Generated from Supabase schema
- Include RLS policy types
- Include foreign key relationships

### API Types
- Request/response shapes
- Validation schemas using Zod
- Error types

## Development

1. Generate updated types:
   ```bash
   pnpm supabase gen types typescript --project-id your-project-id > src/database/types.ts
   ```

2. Build the package:
   ```bash
   pnpm build
   ```

3. Type check:
   ```bash
   pnpm type-check
   ```

## Guidelines

1. Type Generation:
   - Keep database types in sync with Supabase schema
   - Document any manual type modifications
   - Version control type changes

2. Type Safety:
   - Use strict TypeScript settings
   - Include proper null checks
   - Document type constraints

3. Documentation:
   - Document complex type relationships
   - Include usage examples
   - Note any type limitations

4. Validation:
   - Include Zod schemas for runtime validation
   - Document validation rules
   - Keep validation in sync with types
