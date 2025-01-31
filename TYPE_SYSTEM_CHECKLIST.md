# Type System Alignment Checklist

This checklist tracks the tasks needed to align all type definitions with `@supabase.ts` as the single source of truth.

## 1. Database Enums Alignment
- [x] Update `invitation_type` usage from `"team"` to `"agent"` across all files
- [x] Ensure `invitation_status` includes `"cancelled"` state everywhere
- [x] Verify all `ticket_status` values match: `"open" | "in_progress" | "pending" | "resolved" | "closed"`
- [x] Verify all `ticket_priority` values match: `"low" | "medium" | "high" | "urgent"`
- [x] Verify all `user_role` values match: `"head_admin" | "admin" | "agent" | "customer"`

## 2. Views Integration
- [x] Add proper view types in `database.ts`:
  ```typescript
  export type DbAgentInviteView = Database['public']['Views']['agent_organization_invites']['Row'];
  export type DbCustomerInviteView = Database['public']['Views']['customer_organization_invites']['Row'];
  ```
- [x] Remove any manual view type definitions that don't match Supabase

## 3. Function Return Types
- [x] Update `ValidateInviteByEmail` type to match Supabase schema
- [x] Add missing function types from Supabase
- [x] Remove any function types that don't exist in Supabase

## 4. Table Types Clean-up
- [x] Remove `TicketCategory` references (not in schema)
- [ ] Update all table Row types to use Supabase definitions
- [ ] Update all Insert/Update types to match Supabase
- [ ] Verify relationship fields match Supabase foreign keys

## 5. Metadata Types Alignment
- [ ] Update all `Json` type usage to match Supabase definition
- [ ] Verify `metadata` fields in all tables use the correct `Json` type
- [ ] Update AI metadata types to use proper JSON structure

## 6. Forms & UI Types Update
- [x] Update `CreateTicketForm` to remove category field
- [x] Update `UpdateTicketForm` to match table schema
- [x] Fix duplicate `TicketFormData` exports
- [ ] Align all form types with database constraints

## 7. Relationship Types Clean-up
- [x] Update `TicketWithRelations` to match foreign keys
- [x] Update `ProfileWithRelations` to match foreign keys
- [x] Update `OrganizationWithRelations` to match foreign keys
- [ ] Verify optional vs required fields match schema

## 8. Import/Export Structure
- [ ] Clean up circular dependencies between type files
- [ ] Use proper type re-exports in `index.ts`
- [ ] Remove duplicate type exports
- [ ] Use consistent naming for imported types

## 9. Type Guards Update
- [x] Update `isTicket` to check for correct fields
- [x] Update `isTicketWithRelations` to match schema
- [x] Add type guards for other key types
- [x] Ensure type guards use correct field names

## 10. Documentation & Comments
- [x] Add JSDoc comments for complex types
- [x] Document any deviations from Supabase schema
- [x] Add examples for relationship types
- [x] Document AI metadata structure

## 11. File Organization
- [x] Move all base types to `database.ts`
- [x] Move all form types to `forms.ts`
- [x] Move all component types to appropriate feature files
- [x] Clean up `index.ts` exports

## 12. Type Safety Improvements
- [x] Add strict null checks where needed
- [x] Add proper discriminated unions for status fields
- [x] Add proper validation for enum values
- [x] Add proper type narrowing helpers

## 13. Linter and Import Fixes
- [x] Fix import path in scripts/restore-data.ts
- [x] Remove unused User import from database.ts
- [ ] Fix missing './tickets' module error in index.ts
- [ ] Clean up type re-exports in index.ts
- [ ] Fix circular dependencies between type files
- [ ] Ensure consistent use of 'type' imports

## 14. Type Definition Consistency
- [ ] Consolidate duplicate TicketWithRelations definitions
- [ ] Standardize form interfaces across files
- [ ] Fix UpdateTicketForm to use proper type imports
- [ ] Make naming consistent (e.g., assigned_agent vs assigned_agent_id)
- [ ] Remove redundant type definitions from index.ts
- [ ] Ensure all metadata types use proper Json type

## 15. Form Types Alignment
- [ ] Update all form types to match database constraints
- [ ] Ensure consistent use of optional vs required fields
- [ ] Remove any references to non-existent fields (e.g., category)
- [ ] Standardize field naming across all form types
- [ ] Add proper validation types for form fields

## 16. Linter Error Fixes

### Import/Module Errors (Severity 8)
- [x] Fix missing module 'zustand' in organizationStore.ts
- [x] Fix missing module '@/db/types/database' in organizationStore.ts
- [x] Fix missing module './tickets' in index.ts and admin/tickets.tsx
- [x] Fix import paths for supabase types in scripts (backup-data.ts, restore-data.ts)

### Implicit 'any' Type Errors (Severity 8)
- [x] Fix implicit 'any' parameters in App.tsx (state)
- [ ] Fix implicit 'any' parameters in TicketDetails.tsx (t)
- [ ] Fix implicit 'any' parameters in Dashboard.tsx (t)
- [ ] Fix implicit 'any' parameters in CreateOrganization.tsx (state)
- [ ] Fix implicit 'any' parameters in CustomerPortal.tsx (ticket)
- [x] Fix implicit 'any' parameters in organizationStore.ts (set, get, holiday)
- [x] Fix implicit 'any' binding elements in organizationStore.ts (open, close)

### Type Assignment Errors (Severity 8)
- [ ] Fix type assignment in backup-full.ts (users array type)
- [ ] Fix PageParams type in manage-local-users.ts (filter property)
- [x] Fix toLocaleLowerCase error on Date object in organizationStore.ts

### Unused Imports/Declarations (Severity 4)
- [ ] Clean up unused imports in TicketDetails.tsx (toast, TicketStatus, TicketPriority)
- [ ] Clean up unused imports in Dashboard.tsx (Loader2, TicketList, navigate, etc.)
- [ ] Clean up unused imports in portal/tickets/index.tsx (TicketStatus, TicketPriority, etc.)
- [ ] Clean up unused imports in organizationStore.ts (UserRole, BusinessHours, etc.)
- [ ] Clean up unused imports in components/icons.tsx (LucideProps)

### Action Items
1. First fix all severity 8 errors (these can cause runtime issues)
2. Then address severity 4 warnings (code cleanup)
3. Update types to be more strict where implicit 'any' is being used
4. Clean up unused imports and declarations
5. Fix module resolution and import paths

## Notes
- Each task should be completed in isolation and committed separately
- Run type checks after each change
- Update tests if type changes affect them
- Document any deviations from Supabase schema with comments
- Severity 8: Error that needs immediate attention
- Severity 4: Warning that should be fixed but won't break the code
- Fix import paths before fixing other type errors
- Add proper type annotations instead of relying on inference
- Remove unused imports to improve bundle size 