# Invite System Documentation

## Overview
The invite system allows organization administrators and agents to invite new users (both agents and customers) to join their organization. The system provides a secure, user-friendly way to manage invitations with separate flows for team members and customers.

## Architecture

### Database Schema
The system uses two main tables:
- `agent_organization_invites`: Stores invites for team members (agents)
- `customer_organization_invites`: Stores invites for customers

Both tables include:
- `id`: UUID primary key
- `organization_id`: Foreign key to organizations table
- `email`: Invitee's email address
- `token`: Secure UUID token for invite link
- `created_at`: Timestamp of invite creation
- `expires_at`: Expiration timestamp
- `accepted`: Boolean flag for invite status

### Security
- Row Level Security (RLS) policies ensure users can only access invites for their organization
- UUID tokens provide secure, non-guessable invite links
- Proper session management with refresh token handling
- Role-based access control for invite management

## Components

### Admin Dashboard
#### Manage Agents Page (`/admin/manage-agents`)
- Left side: Active invites list showing pending and accepted invites
- Right side: Invite form for new agent invitations
- Real-time updates when invites are created or accepted

#### Invite Customers Page (`/admin/invite-customers`)
- Left side: Active customer invites list
- Right side: Invite form for new customer invitations
- Consistent layout and functionality with the manage agents page

### State Management
#### User Store (`userStore.ts`)
- Handles authentication state
- Manages session persistence
- Provides role-based routing
- Implements secure logout functionality

#### Invite Store (`inviteStore.ts`)
- Manages invite creation and listing
- Handles invite acceptance flow
- Provides loading and error states
- Implements proper error handling

## Features

### Invite Creation
1. Admin/agent enters email address
2. System validates email and checks for existing invites
3. Creates secure invite token
4. Stores invite in appropriate table
5. Returns success/error message

### Invite Management
- View all active invites
- Track invite status (pending/accepted)
- Filter and sort invites
- Cancel pending invites

### Authentication Flow
1. User clicks invite link
2. System validates invite token
3. User sets password
4. Account is created with correct role and organization
5. User is redirected to appropriate dashboard

## Error Handling
- Invalid/expired tokens
- Duplicate invites
- Network failures
- Session management errors
- Authorization errors

## User Experience
- Consistent layout across invite pages
- Clear success/error messaging
- Loading states for all operations
- Toast notifications for user feedback
- Role-appropriate redirects after login

## Recent Improvements
- Fixed refresh token handling
- Improved session state management
- Standardized invite page layouts
- Enhanced error handling and user feedback
- Improved code organization and type safety

## Future Enhancements
- Email validation improvements
- Batch invite functionality
- Custom email templates
- Invite expiration handling
- Rate limiting
- Audit logging
- Additional test coverage
