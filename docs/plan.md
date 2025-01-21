# AutoCRM Authentication Implementation

## Overview
The authentication system is implemented using Supabase Auth with role-based access control for different user types (Customer, Agent, Admin). Each user type has dedicated authentication flows and protected routes.

## Landing Page
The main landing page (`/`) provides four primary entry points:
- **New Organization**: For creating a new organization account
- **Organization Sign In**: For existing organization members to log in
- **New Team Member**: For team member onboarding and profile creation
- **Customer Portal**: Access point for customers to sign in, register, or browse resources

## Authentication Pages

### Team Member Authentication
- **Login** (`/auth/team/login`)
  - Organization slug required
  - Email/password authentication
  - Role-based redirects (admin/agent)
  - Password reset link
  
- **Registration** (`/auth/team/register`)
  - Organization creation
  - Admin account setup
  - Email verification required
  
- **Team Member Join** (`/auth/team/join`)
  - Comprehensive profile creation
  - Personal information (name, email, phone)
  - Professional details (title, department)
  - Bio information
  - Account credentials
  - Role management (starts as 'pending')
  
- **Accept Invite** (`/auth/team/accept-invite`)
  - Token-based invite verification
  - Password setup for new team members
  - Organization details display
  - Role assignment (admin/agent)

### Customer Portal (`/portal`)
- **Main Portal Page**
  - Account access options
  - Knowledge base access
  - Support contact options

- **Customer Authentication**
  - Login (`/auth/customer/login`)
  - Registration (`/auth/customer/register`)
  - Password reset functionality

- **Resources**
  - Knowledge Base (`/portal/kb`)
  - Support Center (`/portal/support`)

### Shared Features
- **Password Reset** (`/auth/reset-password`)
  - Email-based reset flow
  - Reset link generation
  - Success/error feedback

## Implementation Details

### Role-Based Access
- **Admin**: Full system access, organization management
- **Agent**: Customer support features
- **Customer**: Access to customer portal features

### Security Features
- Email verification required for all accounts
- Secure password requirements
- Token-based invite system
- Protected routes based on user roles

### Navigation
- Consistent `AuthHeader` component across all auth pages
- Clear navigation between related pages
- Proper error handling and user feedback

## Database Schema

### Tables
- `profiles`: User profiles with role information
  - Basic user information
  - Professional details for team members
  - Role and permissions
- `organizations`: Organization details
- `organization_invites`: Team member invitations

### Authentication Flow
1. User selects appropriate entry point from landing page
2. Completes registration/login process
3. Email verification (if required)
4. Role assignment
5. Redirect to appropriate dashboard

## Next Steps
- [ ] Implement password update functionality
- [ ] Add multi-factor authentication option
- [ ] Enhance session management
- [ ] Add rate limiting for auth endpoints
- [ ] Complete Knowledge Base implementation
- [ ] Implement Support Center functionality 