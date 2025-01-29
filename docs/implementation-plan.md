# AutoCRM Implementation Plan

## Phase 1: Core Infrastructure Alignment

### 1. Layout Components (Critical)
- [ ] Create base layouts in `/src/components/layout/`
  ```
  /layout
    ├── AdminLayout.tsx
    ├── AgentLayout.tsx
    ├── PortalLayout.tsx
    ├── PublicLayout.tsx
    └── index.ts
  ```
- [ ] Implement shared layout features
  - [ ] Navigation
  - [ ] Header with user info
  - [ ] Role-based sidebar
  - [ ] Error boundaries
- [ ] Add layout types to match database roles
  ```typescript
  type LayoutRole = 'head_admin' | 'admin' | 'agent' | 'customer';
  ```

### 2. Route Structure Cleanup
- [ ] Consolidate ticket routes
  ```
  /pages
    ├── tickets/
    │   ├── [id].tsx        # Unified ticket detail
    │   ├── list.tsx        # List view
    │   └── create.tsx      # Creation form
  ```
- [ ] Implement role-based views
  - [ ] Admin ticket management
  - [ ] Agent ticket handling
  - [ ] Customer ticket viewing
- [ ] Update App.tsx routing
  ```typescript
  <Switch>
    <Route path="/tickets/:id">
      <ProtectedRoute>
        <TicketDetail />
      </ProtectedRoute>
    </Route>
  </Switch>
  ```

## Phase 2: Feature Organization

### 1. Core Feature Modules
- [ ] Create feature directories
  ```
  /src/features
    ├── auth/
    ├── tickets/
    ├── users/
    └── organizations/
  ```
- [ ] Move components to features
  - [ ] Auth components to `/features/auth`
  - [ ] Ticket components to `/features/tickets`
  - [ ] User components to `/features/users`

### 2. Type Alignment with Supabase
- [ ] Update database types
  ```typescript
  // types/database.ts
  export interface Ticket extends DbTicket {
    customer?: Profile;
    assigned_agent?: Profile;
    messages?: TicketMessage[];
  }
  ```
- [ ] Create feature-specific types
  - [ ] Auth types
  - [ ] Ticket types
  - [ ] User types

## Phase 3: Component Standardization

### 1. Naming Convention Implementation
- [ ] Standardize file names
  ```
  components/    -> PascalCase.tsx
  hooks/         -> useFeatureName.ts
  types/         -> feature.types.ts
  utils/         -> featureUtil.ts
  ```
- [ ] Update import paths
- [ ] Create index files for exports

### 2. Component Organization
- [ ] Move shared components
  ```
  /shared
    ├── ui/
    ├── forms/
    └── layout/
  ```
- [ ] Implement feature-specific components
- [ ] Create component documentation

## Phase 4: State Management Alignment

### 1. Store Organization
- [ ] Create feature-based stores
  ```
  /stores
    ├── authStore.ts
    ├── ticketStore.ts
    ├── userStore.ts
    └── index.ts
  ```
- [ ] Implement proper typing from Supabase schema
- [ ] Add proper error handling

### 2. Data Flow Standardization
- [ ] Implement consistent data fetching
- [ ] Add proper loading states
- [ ] Handle error states

## Phase 5: Route Protection & Authorization

### 1. Role-Based Access
- [ ] Implement role checks based on Supabase schema
  ```typescript
  type UserRole = 'head_admin' | 'admin' | 'agent' | 'customer';
  ```
- [ ] Add permission checks
- [ ] Create route guards

### 2. Authentication Flow
- [ ] Align with Supabase auth
- [ ] Implement proper redirects
- [ ] Handle session management

## Checklist by Priority

### Immediate (Week 1)
- [ ] Create and implement layout components
- [ ] Fix ticket detail routing
- [ ] Update App.tsx routing structure
- [ ] Implement proper role-based layouts

### Short-term (Week 2)
- [ ] Move to feature-based organization
- [ ] Update component naming
- [ ] Implement proper type system
- [ ] Create shared components

### Medium-term (Week 3)
- [ ] Complete store reorganization
- [ ] Implement proper error handling
- [ ] Add loading states
- [ ] Create documentation

### Long-term (Week 4)
- [ ] Full alignment with Supabase schema
- [ ] Complete feature isolation
- [ ] Performance optimization
- [ ] Testing implementation

## Database Alignment Notes

### Core Types from Supabase
```sql
create type user_role as enum ('head_admin', 'admin', 'agent', 'customer');
create type ticket_status as enum ('open', 'in_progress', 'pending', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');
```

### Key Relationships
- Organizations -> Profiles (one-to-many)
- Profiles -> Tickets (one-to-many)
- Tickets -> Messages (one-to-many)

### Security Considerations
- Row Level Security from Supabase
- Role-based access control
- Organization isolation

## Next Steps
1. Begin with layout components as they affect all routes
2. Move to ticket consolidation to fix immediate issues
3. Gradually implement feature-based organization
4. Update types and stores to match Supabase schema
5. Implement proper error handling and loading states 