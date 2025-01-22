# AutoCRM Foundation Tasks

## 1. Landing Page & Core Auth Flow
- [ ] Create landing page (/)
  - [ ] Product introduction and value proposition
  - [ ] Clear CTAs for organization registration and role-specific logins
  - [ ] Navigation header with auth options
- [ ] Remove redundant public login/register pages
- [ ] Update logout flow to redirect to landing page

## 2. Organization Registration Flow
- [ ] Create organization registration pages
  - [ ] /auth/org/register (initial signup)
  - [ ] /auth/org/setup (post-registration setup)
  - [ ] /auth/org/login (org admin login)
- [ ] Implement organization creation logic
  - [ ] Create organization in Supabase
  - [ ] Set up initial admin user
  - [ ] Create necessary organization settings

## 3. Role-Based Layouts
- [ ] Create base layout components
  - [ ] AdminLayout
  - [ ] AgentLayout
  - [ ] CustomerLayout
- [ ] Implement shared layout features
  - [ ] Navigation headers
  - [ ] Role-specific sidebars
  - [ ] User profile dropdown
  - [ ] Logout functionality

## 4. Protected Routes & Auth Guards
- [ ] Create ProtectedRoute components
  - [ ] AdminRoute
  - [ ] AgentRoute
  - [ ] CustomerRoute
- [ ] Implement role-based access control
  - [ ] Role verification
  - [ ] Organization membership check
  - [ ] Redirect logic for unauthorized access
- [ ] Add loading states for auth checks

## 5. Authentication State Management
- [ ] Create auth store with Zustand
  - [ ] User session management
  - [ ] Role information
  - [ ] Organization context
- [ ] Implement auth persistence
- [ ] Add auth state observers

## 6. Route Configuration
- [ ] Set up route constants
- [ ] Configure role-based redirects
- [ ] Implement 404 handling
- [ ] Add route transition animations

## 7. API Routes & Middleware
- [ ] Set up API route structure
- [ ] Implement auth middleware
- [ ] Add role verification middleware
- [ ] Set up error handling

## 8. Testing & Validation
- [ ] Test auth flows
  - [ ] Organization registration
  - [ ] Role-specific logins
  - [ ] Protected routes
  - [ ] Logout flow
- [ ] Validate role-based access
- [ ] Test error scenarios

## Implementation Order
1. Landing page & remove redundant routes
2. Organization registration flow
3. Protected route components
4. Role-based layouts
5. Auth state management
6. API routes & middleware
7. Testing & validation

## Notes
- Each task should include proper error handling
- All forms should include proper validation
- Use consistent styling across all auth pages
- Ensure proper loading states for async operations
- Add proper TypeScript types for all components
- Document all major components and utilities 