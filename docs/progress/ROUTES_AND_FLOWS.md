# Routes and User Flows Documentation

## Route Structure
```
/                                  # Landing Page
├── /org
│   ├── /new                      # Create Organization (Head Admin Signup)
│   └── /login                    # Team Login (Admins & Agents)
│
├── /admin
│   ├── /dashboard                # Admin Dashboard
│   ├── /tickets                  # Admin Ticket Management
│   ├── /users                    # User Management
│   ├── /settings                 # Organization Settings
│   └── /invites                  # Invitation Management
│
├── /agent
│   ├── /dashboard                # Agent Dashboard
│   └── /tickets                  # Agent Ticket Queue
│
├── /portal
│   ├── /login                    # Customer Portal Login
│   ├── /dashboard                # Customer Dashboard
│   ├── /tickets                  # Customer Tickets
│   └── /kb                       # Knowledge Base (To Be Added)
│
└── /auth
    ├── /invite                   # Team Invite Accept Flow
    ├── /signup                   # New User Account Creation
    ├── /login                    # General Login
    ├── /reset-password           # Password Reset
    └── /verify                   # Email Verification
```

## User Flows

### 1. Organization Creation Flow
```mermaid
graph TD
    A[Landing Page] -->|Create Organization| B[/org/new]
    B -->|Fill Form| C[Create Auth User]
    C -->|Success| D[Create Organization]
    D -->|Success| E[Create Head Admin Profile]
    E -->|Complete| F[Admin Dashboard]
```

### 2. Team Login Flow
```mermaid
graph TD
    A[Landing Page] -->|Team Login| B[/org/login]
    B -->|Valid Credentials| C{Check Role}
    C -->|Admin/Head Admin| D[Admin Dashboard]
    C -->|Agent| E[Agent Dashboard]
```

### 3. Team Invite Flow
```mermaid
graph TD
    A[Landing Page] -->|Accept Team Invite| B[/auth/invite]
    B -->|Has Account| C[Login]
    B -->|New User| D[Signup]
    D -->|Create Account| E[Check Invite DB]
    E -->|Valid Invite| F[Create Profile]
    F -->|Agent Invite| G[Agent Dashboard]
    F -->|Admin Invite| H[Admin Dashboard]
```

### 4. Customer Portal Flow
```mermaid
graph TD
    A[Landing Page] -->|Access Portal| B[/portal/login]
    B -->|Existing User| C[Customer Dashboard]
    B -->|New Customer| D[/auth/signup]
    D -->|Create Account| E[Check Customer Invites]
    E -->|Valid Invite| F[Create Customer Profile]
    F -->|Complete| G[Customer Dashboard]
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
