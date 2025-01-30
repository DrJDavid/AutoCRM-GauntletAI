# Routes and User Flows Documentation

## Route Structure
```
/                                  # Landing Page
├── /auth
│   ├── /team                     # Team Authentication
│   │   ├── /login               # Team Login (Admins & Agents)
│   │   ├── /register            # Team Registration
│   │   ├── /accept-invite       # Accept Team Invitation
│   │   ├── /join-request        # Request to Join Team
│   │   └── /create-account      # Create Team Account
│   ├── /customer                # Customer Authentication
│   │   ├── /login              # Customer Portal Login
│   │   ├── /register           # Customer Registration
│   │   └── /accept-invite      # Accept Customer Invitation
│   └── /reset-password          # Password Reset
│
├── /admin                        # Admin Portal
│   ├── /tickets                 # Admin Ticket Management
│   │   ├── /:id                # Ticket Details
│   ├── /agents                  # Manage Agents
│   ├── /users                   # User Management
│   ├── /analytics               # Analytics Dashboard
│   ├── /settings                # Organization Settings
│   └── /invite-customers        # Customer Invitation Management
│
├── /agent                        # Agent Portal
│   ├── /tickets                 # Agent Ticket Management
│   │   ├── /:id                # Ticket Details
│   ├── /queue                   # Ticket Queue
│   └── /assigned                # Assigned Tickets
│
├── /portal                       # Customer Portal
│   ├── /tickets                 # Customer Tickets
│   │   ├── /:id                # Ticket Details
│   ├── /kb                      # Knowledge Base
│   └── /support                 # Support Center
│
└── /org                         # Organization Management
    ├── /new                     # Create Organization
    ├── /setup                   # Organization Setup
    ├── /customers/invite        # Invite Customers
    └── /agents/invite           # Invite Agents
```

## User Flows

### 1. Organization Creation Flow
```mermaid
graph TD
    A[Landing Page] -->|Create Organization| B[/org/new]
    B -->|Fill Form| C[Create Auth User]
    C -->|Success| D[Create Organization]
    D -->|Success| E[Create Head Admin Profile]
    E -->|Complete| F[/admin]
```

### 2. Team Login Flow
```mermaid
graph TD
    A[Landing Page] -->|Team Login| B[/auth/team/login]
    B -->|Valid Credentials| C{Check Role}
    C -->|Admin/Head Admin| D[/admin]
    C -->|Agent| E[/agent]
    C -->|Invalid Role| F[/unauthorized]
```

### 3. Team Invite Flow
```mermaid
graph TD
    A[Landing Page] -->|Accept Team Invite| B[/auth/team/accept-invite]
    B -->|Has Account| C[Login]
    B -->|New User| D[/auth/team/create-account]
    D -->|Create Account| E[Check Invite DB]
    E -->|Valid Invite| F[Create Profile]
    F -->|Agent Invite| G[/agent]
    F -->|Admin Invite| H[/admin]
```

### 4. Customer Portal Flow
```mermaid
graph TD
    A[Landing Page] -->|Access Portal| B[/auth/customer/login]
    B -->|Existing User| C[/portal]
    B -->|New Customer| D[/auth/customer/register]
    D -->|Create Account| E[Check Customer Invites]
    E -->|Valid Invite| F[Create Customer Profile]
    F -->|Complete| G[/portal]
```

## Key Requirements

### Authentication & Authorization
1. **User Types**
   - Head Admin (Organization owner)
   - Admin (Organization manager)
   - Agent (Support staff)
   - Customer (End user)

2. **Role-based Access**
   - Head Admin: Full access to all features
   - Admin: Organization management, excluding critical settings
   - Agent: Ticket management and customer interaction
   - Customer: Portal access and ticket creation

### Organization Management
1. **Creation**
   - Organization setup with head admin
   - Custom branding and settings
   - Team member management

2. **Invitations**
   - Team member invites (Admin/Agent)
   - Customer invites
   - Email-based verification

### Portal Access
1. **Customer Features**
   - Ticket creation and management
   - Profile management
   - Knowledge base access (planned)

2. **Agent Features**
   - Ticket queue management
   - Customer interaction
   - Knowledge base contribution (planned)

3. **Admin Features**
   - Organization management
   - User management
   - Settings and configuration
   - Analytics and reporting

## Database Structure
Key tables in Supabase:
1. organizations
2. profiles
3. tickets
4. ticket_messages
5. ticket_attachments
6. invitations

## Planned Additions
1. Public knowledge base
2. FAQ section
3. General documentation
4. Customer self-service features

## Security Considerations
1. RLS policies for all tables
2. Role-based access control
3. Organization-level data isolation
4. Secure invitation process
