# Wouter to React Router Migration Tracker

## Migration Rules
- Replace `useLocation` with `useNavigate` from 'react-router-dom'
- Replace `Link href=` with `Link to=` from 'react-router-dom'
- Replace `useRoute` with `useParams` from 'react-router-dom'
- Replace `useParams` from 'wouter' with `useParams` from 'react-router-dom'

## Type Fixes Pattern
When fixing each file:
1. Import proper types from `@/types/database`
2. Use type guards for nullable fields
3. Ensure proper typing for component props
4. Fix any Supabase-related type issues
5. Transform database types to frontend types where needed

## High Priority Files (Core User Flows)

### Portal Pages (Customer Experience)
- [x] pages/portal/index.tsx
  - [x] Replace useLocation with useNavigate
  - [x] Fix types
  - [x] Remove unused category field
- [x] pages/portal/support/index.tsx
  - [x] Replace useLocation with useNavigate
  - [x] Add proper interface for support options
  - [x] Fix types
- [x] pages/CustomerPortal.tsx
  - [x] Replace useLocation with useNavigate
  - [x] Fix ticket type issues
  - [x] Add proper type guards for status/priority

### Ticket Management
- [x] pages/TicketListPage.tsx
  - [x] Replace useLocation with useNavigate
  - [x] Fix ticket type issues
  - [x] Add proper type transformation
  - [x] Handle nullable fields
- [ ] features/tickets/pages/[id].tsx
  - [ ] Replace useRoute
  - [ ] Replace Link
  - [ ] Fix types
- [ ] features/tickets/pages/list.tsx
  - [ ] Replace useLocation
  - [ ] Fix types

### Agent Workspace
- [x] pages/agent/dashboard.tsx
  - [x] Replace useLocation with useNavigate
  - [x] Fix types
  - [x] Add proper type guards
  - [x] Fix Supabase query structure
- [ ] pages/agent/queue.tsx
  - [ ] Replace useLocation
  - [ ] Fix types
- [ ] pages/agent/queue/index.tsx
  - [ ] Replace useLocation
  - [ ] Fix types
- [ ] pages/agent/team.tsx
  - [ ] Replace useLocation
  - [ ] Fix types
- [ ] pages/agent/assigned.tsx
  - [ ] Replace useLocation
  - [ ] Fix types
- [ ] pages/agent/assigned/index.tsx
  - [ ] Replace useLocation
  - [ ] Fix types
- [ ] pages/agent/ticket/[id].tsx
  - [ ] Replace useParams
  - [ ] Fix types

### Admin Pages
- [x] pages/admin/dashboard.tsx
  - [x] Replace Link with react-router Link
  - [x] Fix types
- [ ] pages/Dashboard.tsx
  - [ ] Replace useLocation
  - [ ] Fix types

### Auth Pages (Keep Only What We Use)
- [ ] pages/auth/ResetPassword.tsx
  - [ ] Replace useLocation
  - [ ] Replace Link
  - [ ] Fix types
- [ ] pages/auth/customer/Register.tsx
  - [ ] Replace useLocation
  - [ ] Replace Link
  - [ ] Fix types
- [ ] pages/auth/agent/Register.tsx
  - [ ] Replace useLocation
  - [ ] Replace Link
  - [ ] Fix types

### Organization Pages
- [ ] pages/org/CustomerInvite.tsx
  - [ ] Replace useLocation
  - [ ] Fix types

## Type Issues to Track

### Current Type Issues
1. Ticket Types
   - [x] Fix nullable status/priority handling
   - [x] Add proper type guards
   - [x] Update TicketList component expectations
   - [x] Add database to frontend type transformation

2. Organization Types
   - [ ] Fix organization relation in Profile type
   - [ ] Add proper type guards for organization data

3. User/Profile Types
   - [ ] Ensure proper typing for auth flows
   - [ ] Fix organization relation types

## Detailed Type Issues Checklist

### Missing Module Declarations
- [ ] `@/pages/auth/team/Register`
- [ ] `@/pages/auth/team/AcceptInvite`
- [ ] `@/pages/auth/team/TeamJoinRequest`
- [ ] `@/pages/auth/customer/AcceptInvite`
- [ ] `@/components/icons`

### Organization/Profile Type Issues
- [ ] Fix `organization` vs `organization_id` property mismatches in:
  - [ ] `pages/admin/Dashboard.tsx`
  - [ ] `pages/org/Setup.tsx`
- [ ] Update Profile type to properly include organization relation

### Ticket Type Issues
- [ ] Fix `customer` property access in `pages/admin/tickets/[id].tsx`
- [ ] Fix `assigned_agent` vs `assigned_to` property mismatches
- [ ] Add proper type guards for nullable fields:
  - [ ] `status`
  - [ ] `priority`
  - [ ] `created_at`
  - [ ] `closed_at`
- [ ] Fix ticket relation types in agent queue
- [ ] Update `TicketWithRelations` type

### Auth Type Issues
- [ ] Fix `type` property in Login components (invalid "default" value)
- [ ] Update auth credentials type to support all login types

### Unused Imports/Variables Cleanup
- [ ] App.tsx:
  - [ ] `Navigate`
  - [ ] `PublicLayout`
  - [ ] `LayoutRole`
  - [ ] `TeamRegister`
  - [ ] `AgentLogin`
  - [ ] `AgentRegister`
- [x] Admin Dashboard:
  - [x] `Users`
  - [x] `Clock`
  - [x] `ArrowUpRight`
  - [x] `ArrowDownRight`
  - [x] Various ticket state variables
- [x] Agent Dashboard:
  - [x] `CardDescription`
  - [x] `UserPlus`
- [ ] Agent Queue:
  - [ ] `UserPlus`
  - [ ] `categoryColors`
- [x] Layout Components:
  - [x] `HelpCircle`
  - [x] `LogOut`
  - [x] `Button`
  - [x] `toast`
- [x] Portal:
  - [x] `PortalLayout`

### Database/Store Type Issues
- [ ] Fix Supabase role type in userStore (string vs enum)
- [ ] Update ticket store types for proper relations
- [ ] Fix database types for proper null handling
- [ ] Update mock types in tests

## Action Items
1. Create missing module declarations or remove unused imports
2. Update database types to match Supabase schema
3. Add proper type guards for nullable fields
4. Fix property name mismatches
5. Clean up unused imports/variables
6. Update auth types for proper role handling

## Progress
- [x] Removed wouter from package.json
- [x] Updated portal layout
- [x] Fixed ticket list page types
- [x] Updated admin dashboard
- [x] Updated portal index page
- [x] Updated portal support page
- [x] Updated CustomerPortal page
- [ ] Remaining files: 12

## Notes
- Keep track of any patterns or issues discovered during migration
- Document any breaking changes or necessary updates to related components
- Note any performance improvements needed
- Removed category field from portal index as it's not in our database schema
- Added proper TypeScript interface for support options in portal/support/index.tsx
- Added proper type guards for ticket status and priority in CustomerPortal
- Cleaned up unused imports in multiple components to reduce noise
- Note: Some import cleanup revealed deeper type issues that need addressing
- Fixed agent dashboard types and Supabase query structure to match our schema
- Added proper type guards for nullable fields in agent dashboard
- Improved error handling in data transformations
- Removed unused team auth flow (AcceptInvite, TeamJoinRequest)
- Removed customer invite flow as it's not implemented yet
- Added proper type transformation for database to frontend ticket types
- Fixed ticket list component to handle nullable fields correctly

## Removed Features (Not Implemented)
1. Team Auth Flow
   - Team Accept Invite (removed)
   - Team Join Request (removed)
   - Team Create Account (removed)

2. Customer Invite Flow
   - Customer Accept Invite

## Retained Team Auth Features
1. Basic Team Auth
   - Team Login (`/auth/team/login`)
   - Team Create Account (`/auth/team/create-account`)
