# AutoCRM Route Documentation

## Route Structure Overview

```
/                                  # Landing Page
├── /auth                         # Authentication Routes
│   ├── /team                     # Team Authentication
│   │   ├── /register            # Team Registration
│   │   └── /login               # Team Login
│   └── /customer                # Customer Authentication
│       ├── /register            # Customer Registration
│       └── /login               # Customer Login
│
├── /admin                        # Admin Portal
│   ├── /dashboard               # Admin Dashboard
│   ├── /tickets                 # Ticket Management
│   │   ├── /                   # Ticket List
│   │   ├── /new                # Create Ticket
│   │   └── /:id                # Ticket Details
│   ├── /users                   # User Management
│   │   ├── /                   # User List
│   │   └── /:id                # User Details
│   ├── /settings                # Organization Settings
│   └── /invites                 # Invitation Management
│
├── /agent                        # Agent Portal
│   ├── /dashboard               # Agent Dashboard
│   └── /tickets                 # Ticket Queue
│       ├── /                   # Ticket List
│       ├── /new                # Create Ticket
│       └── /:id                # Ticket Details
│
└── /portal                       # Customer Portal
    ├── /dashboard               # Customer Dashboard
    ├── /tickets                 # Customer Tickets
    │   ├── /                   # Ticket List
    │   ├── /new                # Create Ticket
    │   └── /:id                # Ticket Details
    └── /kb                      # Knowledge Base
```

## Implementation Details

### Authentication Components

#### Team Registration (`/auth/team/register`)
- Component: `Register.tsx` in `/pages/auth/team/`
- Features:
  - Email and password form with validation
  - Checks for pending invitation using `validate_invite_by_email`
  - Creates user account and associates with organization
  - Assigns role based on invitation
  - Error handling for invalid/expired invitations
  - Loading states during async operations
  - Redirects to login on success

#### Customer Registration (`/auth/customer/register`)
- Component: `Register.tsx` in `/pages/auth/customer/`
- Features:
  - Similar to team registration
  - Role fixed to 'customer'
  - Organization association from invitation
  - Customer-specific validation rules
  - Portal-specific redirects

#### Team Login (`/auth/team/login`)
- Component: `Login.tsx` in `/pages/auth/team/`
- Features:
  - Email/password authentication
  - Role-based dashboard redirection
  - Error handling for invalid credentials
  - Loading states during authentication
  - "Remember me" functionality

#### Customer Login (`/auth/customer/login`)
- Component: `Login.tsx` in `/pages/auth/customer/`
- Features:
  - Similar to team login
  - Portal-specific redirects
  - Customer-focused error messages
  - Password reset option

### Admin Portal Components

#### Dashboard (`/admin/dashboard`)
- Overview of organization metrics
- Quick access to common actions
- Real-time updates using Supabase Realtime

#### Ticket Management (`/admin/tickets`)
- List view with filtering and sorting
- Detailed ticket view
- Assignment functionality
- Status management

#### User Management (`/admin/users`)
- Team member list
- Role management
- Access control

#### Invitation Management (`/admin/invites`)
- Component: `InviteManagement.tsx`
- Features:
  - Create new invitations
  - View pending invitations
  - Revoke active invitations
  - Track invitation status
  - Role selection for team members
  - Error handling and validation

### Agent Portal Components

#### Dashboard (`/agent/dashboard`)
- Ticket queue overview
- Performance metrics
- Quick actions

#### Ticket Queue (`/agent/tickets`)
- Assigned tickets list
- Ticket details view
- Update functionality
- Customer communication

### Customer Portal Components

#### Dashboard (`/portal/dashboard`)
- Ticket overview
- Quick ticket creation
- Status updates

#### Tickets (`/portal/tickets`)
- Ticket history
- Create new tickets
- Communication with agents

## Security Implementation

### Route Guards
- `ProtectedRoute` component wraps all authenticated routes
- Role-based access control using Zustand store
- Session validation on navigation
- Automatic redirect for unauthorized access

### Authentication Flow
1. User registration:
   ```typescript
   // Check invitation
   const { data, error } = await supabase.rpc('validate_invite_by_email', {
     email_param: email,
     type_param: role
   });

   // Create account
   await signUp(email, password, role, organizationId);
   ```

2. Login process:
   ```typescript
   // Authenticate
   const { data, error } = await supabase.auth.signInWithPassword({
     email,
     password
   });

   // Get user profile and role
   await getUserProfile();
   ```

### Error Handling
- Form validation using Zod
- API error handling with toast notifications
- Loading states during async operations
- Error boundaries for component failures

## State Management

### Authentication Store
- User session state
- Role and permissions
- Organization context

### Invitation Store
- Pending invitations
- Creation/revocation actions
- Status tracking

## Future Enhancements
1. Email Integration:
   - Invitation emails
   - Welcome messages
   - Password reset
2. Enhanced Security:
   - 2FA support
   - Session management
   - Access logging
3. UI/UX Improvements:
   - Enhanced form validation
   - Better error messages
   - Loading skeletons
4. Analytics:
   - User activity tracking
   - Performance monitoring
   - Usage statistics
