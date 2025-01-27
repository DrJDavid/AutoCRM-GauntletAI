# Client Reorganization Checklist

## 1. Create New Directory Structure 
- [x] /src/features
  - [x] /auth
  - [x] /tickets
  - [x] /organizations
  - [x] /users
- [x] /src/shared
  - [x] /components
    - [x] /ui
    - [x] /layout
    - [x] /forms
  - [x] /hooks
  - [x] /utils
  - [x] /constants
- [x] /src/lib
- [x] /src/styles
- [x] /src/types

## 2. Move Authentication Files 
- [ ] Move from /components/auth
  - [ ] AuthHeader.tsx → /features/auth/components
  - [ ] ProtectedRoute.tsx → /features/auth/components
- [ ] Create /features/auth/stores
  - [ ] Move auth-related state from stores/
  - [ ] Update imports in components
- [ ] Create /features/auth/types
  - [ ] Extract auth types from types/
  - [ ] Update type imports
- [ ] Create /features/auth/hooks
  - [ ] Extract auth hooks from hooks/
  - [ ] Update hook imports
- [x] Create /features/auth/index.ts
- [x] Create /features/auth/README.md

## 3. Move Ticket Files 
- [ ] Move from /components/tickets
  - [ ] TicketDetail.tsx → /features/tickets/components
  - [ ] TicketForm.tsx → /features/tickets/components
  - [ ] TicketList.tsx → /features/tickets/components
  - [ ] Create /features/tickets/components/chat
- [ ] Create /features/tickets/stores
  - [ ] Move ticket-related state from stores/
  - [ ] Update imports in components
- [ ] Create /features/tickets/types
  - [ ] Extract ticket types from types/
  - [ ] Update type imports
- [ ] Create /features/tickets/hooks
  - [ ] Extract ticket hooks from hooks/
  - [ ] Update hook imports
- [x] Create /features/tickets/index.ts
- [x] Create /features/tickets/README.md

## 4. Move Organization Files 
- [ ] Move organization-related components
  - [ ] Create InviteList.tsx → /features/organizations/components
  - [ ] Create InviteManagement.tsx → /features/organizations/components
  - [ ] Create TestInviteGenerator.tsx → /features/organizations/components
- [ ] Create /features/organizations/stores
  - [ ] Move organization-related state from stores/
  - [ ] Update imports in components
- [ ] Create /features/organizations/types
  - [ ] Extract organization types from types/
  - [ ] Update type imports
- [ ] Create /features/organizations/hooks
  - [ ] Extract organization hooks from hooks/
  - [ ] Update hook imports
- [x] Create /features/organizations/index.ts
- [x] Create /features/organizations/README.md

## 5. Move Shared Components 
- [ ] Move UI components
  - [ ] All shadcn components → /shared/components/ui (50+ components)
  - [ ] Update all component imports
- [ ] Move Layout components
  - [ ] AdminLayout.tsx → /shared/components/layout
  - [ ] AgentLayout.tsx → /shared/components/layout
  - [ ] Footer.tsx → /shared/components/layout
  - [ ] Header.tsx → /shared/components/layout
  - [ ] PortalLayout.tsx → /shared/components/layout
  - [ ] Sidebar.tsx → /shared/components/layout
- [ ] Move other shared components
  - [ ] FileUpload.tsx → /shared/components/forms
  - [ ] RichTextEditor.tsx → /shared/components/forms
  - [ ] StatusBadge.tsx → /shared/components/ui
  - [ ] FileViewer.tsx → /shared/components/ui

## 6. Move and Organize Types 
- [x] Move database types
  - [x] supabase.ts → /types
  - [x] database.types.ts stays in /supabase/types
- [x] Create common types
  - [x] common.ts → /types
  - [x] index.ts → /types

## 7. Update Imports and Configurations 
- [ ] Update tsconfig.json paths
  - [ ] Add feature paths
  - [ ] Add shared paths
  - [ ] Add lib paths
- [ ] Update vite.config.ts aliases
  - [ ] Add feature aliases
  - [ ] Add shared aliases
  - [ ] Add lib aliases
- [ ] Update all import statements to use new paths
  - [ ] Update feature imports
  - [ ] Update shared imports
  - [ ] Update lib imports
- [x] Add index.ts files for each feature directory
- [x] Add README.md files for each feature directory

## 8. Testing and Verification 
- [ ] Verify all imports resolve correctly
  - [ ] Run TypeScript compiler
  - [ ] Fix any import errors
- [ ] Check for any circular dependencies
  - [ ] Use madge or similar tool
  - [ ] Resolve any cycles found
- [ ] Test all major features work
  - [ ] Authentication flows
    - [ ] Registration
    - [ ] Login
    - [ ] Invitation system
  - [ ] Ticket management
    - [ ] Creation
    - [ ] Updates
    - [ ] Chat
  - [ ] Organization management
    - [ ] Settings
    - [ ] User management
    - [ ] Invitations
  - [ ] User management
    - [ ] Profile updates
    - [ ] Role management
- [ ] Verify build process works
  - [ ] Run production build
  - [ ] Check bundle size
  - [ ] Test optimizations
- [ ] Run type checks
  - [ ] Fix any type errors
  - [ ] Update type definitions

## Next Steps
1. Start with auth feature migration
2. Move to tickets feature
3. Handle organization components
4. Tackle shared components last
5. Update configuration files
6. Run comprehensive tests

## Notes
- Keep commits small and focused
- Test after each component move
- Update documentation as we go
- Consider creating migration scripts
