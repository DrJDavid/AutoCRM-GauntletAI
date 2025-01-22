# AutoCRM Route Structure

## Authentication Routes
```
/auth
├── /org
│   ├── /login            # Organization owner/admin login
│   ├── /register         # New organization registration
│   └── /setup           # Initial organization setup after registration
├── /agent
│   ├── /login           # Agent login
│   ├── /register        # Agent registration (invite only)
│   └── /accept-invite   # Agent invite acceptance
├── /customer
│   ├── /login           # Customer login
│   ├── /register        # Customer registration (invite only)
│   └── /accept-invite   # Customer invite acceptance
└── /reset-password      # Password reset flow
```

## Agent Portal Routes
```
/agent
├── /dashboard           # Agent main dashboard
├── /team               # Team management
├── /tickets            # Ticket management
│   ├── /[id]          # Individual ticket view
│   └── /new           # Create new ticket
├── /customers          # Customer management
└── /settings          # Agent settings
```

## Customer Portal Routes
```
/portal
├── /dashboard          # Customer dashboard
├── /tickets           # Customer tickets
│   ├── /[id]         # Individual ticket view
│   └── /new          # Create new ticket
└── /settings         # Customer settings
```

## Admin/Organization Routes
```
/admin
├── /dashboard         # Admin/org owner dashboard
├── /agents           # Agent management
│   └── /invite      # Invite new agents
├── /customers        # Customer management
│   └── /invite      # Invite new customers
├── /organization     # Organization management
│   ├── /settings    # Organization settings
│   └── /billing     # Billing and subscription
├── /settings        # Admin user settings
└── /analytics       # Analytics dashboard
```

## API Routes
```
/api
├── /auth
│   ├── /register    # User registration (org/agent/customer)
│   ├── /login       # User login
│   └── /invite     # User invitations (agents/customers)
├── /tickets        # Ticket management
└── /organizations  # Organization management
```

## User Types & Access Levels

### Organization Owner/Admin
- Can register new organization
- Full access to admin portal
- Can invite and manage agents
- Can invite and manage customers
- Access to analytics and billing

### Agent
- Invite-only registration
- Access to agent portal
- Can manage assigned tickets
- Can view customer information
- Team collaboration features

### Customer
- Invite-only registration
- Access to customer portal
- Can create and view tickets
- Can manage their own settings

## Protected Route Structure
All routes require authentication and proper role assignment:
1. Organization routes require owner/admin role
2. Agent routes require agent role
3. Customer routes require customer role
4. All authenticated routes require valid organization membership

## Navigation Structure
Each role has a dedicated layout:

### Admin Layout
- Organization management
- User management
- Analytics
- Settings

### Agent Layout
- Ticket management
- Customer management
- Team collaboration
- Personal settings

### Customer Layout
- Ticket creation/tracking
- Account settings
- Support resources

## Route Naming Conventions
- Use kebab-case for URLs
- Use descriptive names
- Keep URLs short and meaningful
- Use proper HTTP methods for API routes 