# Type System and Component Fixes

## Immediate Issues

### Layout Component Issues
- [ ] Fix PublicLayout import in App.tsx
  ```typescript
  // Current error: Cannot find module '@/components/layout/PublicLayout'
  // Need to ensure PublicLayout.tsx is properly exported and path is correct
  ```

### Type Mismatches in TicketDetailPage.tsx
- [ ] Fix DbTicket vs Ticket type mismatch
  - Issue: DbTicket missing 'description' field that Ticket requires
  - Solution: Update types to use `current_description` consistently
  ```typescript
  // Need to update either DbTicket or Ticket interface to align fields
  interface Ticket {
    current_description: string; // instead of description
  }
  ```

- [ ] Fix string vs TicketStatus type mismatch
  ```typescript
  // Need to ensure status changes use proper TicketStatus type
  type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
  ```

- [ ] Fix timestamp field naming
  - Change `createdAt` to `created_at`
  - Change `updatedAt` to `updated_at`

- [ ] Fix TicketDetail props interface
  ```typescript
  // Need to update TicketDetailProps to include messages
  interface TicketDetailProps {
    ticket: DbTicket;
    messages?: TicketMessage[];
    onStatusChange: (newStatus: TicketStatus) => void;
  }
  ```

### UserStore Issues
- [ ] Clean up duplicate persist configuration
  ```typescript
  // Remove duplicate persist configuration at the end of userStore.ts
  ```

## Medium Priority

### AdminLayout Type Issues
- [ ] Fix location comparison in AdminLayout
  ```typescript
  // Current: location === item.href
  // Need to properly type location from wouter
  ```

### Type Consistency
- [ ] Audit and align all ticket-related types
  - DbTicket
  - Ticket
  - TicketWithRelations
  - CreateTicketForm
  - UpdateTicketForm

## Long Term Improvements

### Database Type Alignment
- [ ] Ensure all component types match Supabase schema
- [ ] Create proper type guards for data transformations
- [ ] Implement proper error types
- [ ] Add runtime type checking for API responses

### Component Props Standardization
- [ ] Create consistent prop interfaces for all components
- [ ] Add proper children typing
- [ ] Implement proper event handler types

## Migration Considerations

Based on migrations in supabase/migrations:
- [ ] Ensure types match `00000000000000_initial_schema.sql`
- [ ] Update RLS policies from `00000000000001_rls_policies.sql`
- [ ] Incorporate helper functions from `00000000000002_helper_functions.sql`

## Type System Architecture

### Current Issues
1. Inconsistent naming between frontend and database types
2. Missing proper type guards
3. Incomplete prop type definitions
4. Inconsistent use of enums vs union types

### Proposed Solutions
1. Create clear type hierarchy
   ```typescript
   // Base types from database
   type DbTicket = { ... }
   
   // Extended types for frontend
   interface Ticket extends DbTicket {
     // Additional frontend-specific fields
   }
   ```

2. Implement proper type guards
   ```typescript
   function isTicket(obj: unknown): obj is Ticket {
     return obj !== null && typeof obj === 'object' && 'id' in obj;
   }
   ```

3. Standardize component props
   ```typescript
   interface BaseProps {
     className?: string;
   }
   
   interface LayoutProps extends BaseProps {
     children: React.ReactNode;
   }
   ```

## Next Steps

1. Start with PublicLayout fix as it blocks proper routing
2. Move to TicketDetailPage type fixes
3. Clean up userStore duplicate code
4. Implement proper type guards
5. Update component prop interfaces

Remember to:
- Test each fix thoroughly
- Update documentation
- Add proper error boundaries
- Consider edge cases 