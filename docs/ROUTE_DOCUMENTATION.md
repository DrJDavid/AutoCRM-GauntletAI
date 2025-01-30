# AutoCRM Route Documentation

## Route Structure Overview

```
/                                  # Landing Page
├── /auth                         # Authentication Routes
│   ├── /team                     # Team Authentication
│   │   ├── /login               # Team Login
│   │   ├── /register            # Team Registration
│   │   ├── /accept-invite       # Accept Team Invitation
│   │   ├── /join-request        # Request to Join Team
│   │   └── /create-account      # Create Team Account
│   ├── /customer                # Customer Authentication
│   │   ├── /login              # Customer Login
│   │   ├── /register           # Customer Registration
│   │   └── /accept-invite      # Accept Customer Invitation
│   └── /reset-password          # Password Reset
│
├── /admin                        # Admin Portal
│   ├── /tickets                 # Ticket Management
│   │   ├── /                   # Ticket List
│   │   └── /:id                # Ticket Details
│   ├── /agents                  # Manage Agents
│   ├── /users                   # User Management
│   ├── /analytics               # Analytics Dashboard
│   ├── /settings                # Organization Settings
│   └── /invite-customers        # Customer Invitation Management
│
├── /agent                        # Agent Portal
│   ├── /tickets                 # Ticket Management
│   │   ├── /                   # Ticket List
│   │   └── /:id                # Ticket Details
│   ├── /queue                   # Ticket Queue
│   └── /assigned                # Assigned Tickets
│
├── /portal                       # Customer Portal
│   ├── /tickets                 # Customer Tickets
│   │   ├── /                   # Ticket List
│   │   └── /:id                # Ticket Details
│   ├── /kb                      # Knowledge Base
│   └── /support                 # Support Center
│
└── /org                         # Organization Management
    ├── /new                     # Create Organization
    ├── /setup                   # Organization Setup
    ├── /customers/invite        # Invite Customers
    └── /agents/invite           # Invite Agents
```

## Implementation Details

### Authentication Components

#### Team Login (`/auth/team/login`)
- Component: `Login.tsx` in `/pages/auth/team/`
- Features:
  - Organization slug, email, and password form
  - Role-based routing:
    - Admin/Head Admin -> `/admin`
    - Agent -> `/agent`
    - Invalid -> `/unauthorized`
  - Error handling for invalid credentials
  - Loading states during authentication
  - Toast notifications for success/failure

#### Team Registration (`/auth/team/register`)
- Component: `Register.tsx` in `/pages/auth/team/`
- Features:
  - Email and password form with validation
  - Organization slug validation
  - Checks for pending invitation
  - Creates user account and associates with organization
  - Assigns role based on invitation
  - Error handling for invalid/expired invitations

#### Customer Login (`/auth/customer/login`)
- Component: `Login.tsx` in `/pages/auth/customer/`
- Features:
  - Email/password authentication
  - Portal-specific redirects
  - Customer-focused error messages
  - Password reset option

### Admin Portal Components

#### Ticket Management (`/admin/tickets`)
- List view with filtering and sorting
- Detailed ticket view
- Assignment functionality
- Status management

#### User Management (`/admin/users`)
- Team member list
- Role management
- Access control

#### Analytics (`/admin/analytics`)
- Organization metrics
- Performance tracking
- Usage statistics

### Agent Portal Components

#### Ticket Management (`/agent/tickets`)
- Assigned tickets list
- Ticket details view
- Update functionality
- Customer communication

#### Ticket Queue (`/agent/queue`)
- Unassigned tickets
- Priority management
- Assignment options

### Customer Portal Components

#### Tickets (`/portal/tickets`)
- Ticket history
- Create new tickets
- Communication with agents

#### Knowledge Base (`/portal/kb`)
- Documentation
- FAQs
- Self-service resources

## Security Implementation

### Route Protection
```typescript
// ProtectedRoute component
<Route path="/admin">
  <ProtectedRoute allowedRoles={['admin', 'head_admin']}>
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        // ... other admin routes
      </Switch>
    </AdminLayout>
  </ProtectedRoute>
</Route>
```

### Authentication Flow
```typescript
// Team Login
const onSubmit = async (values) => {
  await login({
    type: 'team',
    email: values.email,
    password: values.password,
    organizationSlug: values.organizationSlug,
  });

  const { currentUser } = useUserStore.getState();
  
  switch (currentUser.role) {
    case 'head_admin':
    case 'admin':
      setLocation('/admin');
      break;
    case 'agent':
      setLocation('/agent');
      break;
    default:
      setLocation('/unauthorized');
  }
};
```

## State Management

### User Store
```typescript
interface UserStore {
  currentUser: User | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
```

## Future Enhancements
1. Enhanced Security:
   - 2FA support
   - Session management
   - Access logging
2. UI/UX Improvements:
   - Better loading states
   - Error boundaries
   - Form validation
3. Feature Additions:
   - Public knowledge base
   - Team chat
   - Automated workflows
