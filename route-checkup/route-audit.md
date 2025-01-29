# AutoCRM Route Audit & Action Plan

## Directory Structure
```
/src
├── pages/
│   ├── admin/
│   ├── agent/
│   ├── portal/
│   ├── org/
│   ├── auth/
│   ├── TicketDetailPage.tsx
│   ├── TicketListPage.tsx
│   ├── Landing.tsx
│   ├── not-found.tsx
│   ├── Dashboard.tsx
│   └── CustomerPortal.tsx
```

## Route Audit

### Public Routes
| Route | Component Import | Status | Action Needed |
|-------|-----------------|---------|---------------|
| `/` | `Landing` | ✅ Exists | None |
| `/login` | `Login` | ❌ Missing | Create Login component or remove route |
| `/register` | `Register` | ❌ Missing | Create Register component or remove route |

### Auth Routes
| Route | Component Import | Status | Action Needed |
|-------|-----------------|---------|---------------|
| `/auth/reset-password` | `ResetPassword` | ❌ Missing | Create ResetPassword component |
| `/auth/reset-password/confirm` | `ResetPassword` | ❌ Missing | Same as above |

### Organization Routes
| Route | Component Import | Status | Action Needed |
|-------|-----------------|---------|---------------|
| `/org/new` | `OrganizationNew` | ❓ Unknown | Verify in /pages/org/New.tsx |
| `/org/login` | `OrganizationLogin` | ❓ Unknown | Verify in /pages/org/Login.tsx |
| `/org/setup` | `OrganizationSetup` | ❓ Unknown | Verify in /pages/org/Setup.tsx |

### Team Member Routes
| Route | Component Import | Status | Action Needed |
|-------|-----------------|---------|---------------|
| `/auth/team/accept-invite` | `TeamAcceptInvite` | ❓ Unknown | Verify in /pages/auth/team/AcceptInvite.tsx |
| `/auth/team/login` | `TeamLogin` | ❓ Unknown | Verify in /pages/auth/team/Login.tsx |
| `/auth/team/join` | `TeamJoin` | ❓ Unknown | Verify in /pages/auth/team/Join.tsx |
| `/auth/team/join-request` | `TeamJoinRequest` | ❓ Unknown | Verify in /pages/auth/team/JoinRequest.tsx |
| `/auth/team/create-account` | `TeamCreateAccount` | ❓ Unknown | Verify in /pages/auth/team/CreateAccount.tsx |

### Agent Routes
| Route | Component Import | Status | Action Needed |
|-------|-----------------|---------|---------------|
| `/auth/agent/login` | `AgentLogin` | ❓ Unknown | Verify in /pages/auth/agent/Login.tsx |
| `/auth/agent/register` | `AgentRegister` | ❓ Unknown | Verify in /pages/auth/agent/Register.tsx |

### Customer Routes
| Route | Component Import | Status | Action Needed |
|-------|-----------------|---------|---------------|
| `/auth/customer/accept-invite` | `CustomerAcceptInvite` | ❓ Unknown | Verify in /pages/auth/customer/AcceptInvite.tsx |
| `/auth/customer/login` | `CustomerLogin` | ✅ Exists | None |
| `/auth/customer/register` | `CustomerRegister` | ❓ Unknown | Verify in /pages/auth/customer/Register.tsx |

### Protected Admin Routes
| Route | Component Import | Status | Action Needed |
|-------|-----------------|---------|---------------|
| `/admin` | `AdminDashboard` | ❓ Unknown | Verify in /pages/admin/Dashboard.tsx |
| `/admin/tickets` | `AdminTickets` | ❓ Unknown | Verify in /pages/admin/tickets/index.tsx |
| `/admin/tickets/:id` | `AgentTicketDetailsPage` | ❌ Wrong Import | Should use TicketDetailPage.tsx |
| `/admin/agents` | `ManageAgents` | ❓ Unknown | Verify in /pages/admin/agents/index.tsx |
| `/admin/users` | `UserManagement` | ❓ Unknown | Verify in /pages/admin/users/index.tsx |
| `/admin/analytics` | `AdminAnalytics` | ❓ Unknown | Verify in /pages/admin/analytics/index.tsx |
| `/admin/settings` | `AdminSettings` | ❓ Unknown | Verify in /pages/admin/settings/index.tsx |
| `/admin/invite-customers` | `InviteCustomers` | ❓ Unknown | Verify in /pages/admin/invite-customers/index.tsx |

### Protected Agent Routes
| Route | Component Import | Status | Action Needed |
|-------|-----------------|---------|---------------|
| `/agent` | `AgentDashboard` | ❓ Unknown | Verify in /pages/agent/Dashboard.tsx |
| `/agent/tickets` | `AgentTickets` | ✅ Exists | None |
| `/agent/tickets/:id` | `AgentTicketDetailsPage` | ❌ Wrong Import | Should use TicketDetailPage.tsx |
| `/agent/queue` | `TicketQueue` | ❓ Unknown | Verify in /pages/agent/queue/index.tsx |
| `/agent/assigned` | `AssignedTickets` | ❓ Unknown | Verify in /pages/agent/assigned/index.tsx |

### Protected Customer Routes
| Route | Component Import | Status | Action Needed |
|-------|-----------------|---------|---------------|
| `/portal` | `CustomerPortal` | ✅ Exists | None |
| `/portal/tickets` | `CustomerTickets` | ✅ Exists | None |
| `/portal/tickets/:id` | `TicketDetails` | ❌ Wrong Import | Should use TicketDetailPage.tsx |
| `/portal/kb` | `KnowledgeBase` | ❓ Unknown | Verify in /pages/portal/kb/index.tsx |
| `/portal/support` | `Support` | ❓ Unknown | Verify in /pages/portal/support/index.tsx |

## Action Items

1. **Fix Incorrect Ticket Detail Routes**
   - [ ] Update all ticket detail routes to use `TicketDetailPage` component
   - [ ] Remove unused ticket detail components if they exist

2. **Missing Core Components**
   - [ ] Create or locate Login component
   - [ ] Create or locate Register component
   - [ ] Create or locate ResetPassword component

3. **Verify Organization Pages**
   - [ ] Check /pages/org/New.tsx
   - [ ] Check /pages/org/Login.tsx
   - [ ] Check /pages/org/Setup.tsx

4. **Verify Team Member Pages**
   - [ ] Check all pages in /pages/auth/team/
   - [ ] Create missing team auth pages

5. **Verify Agent Pages**
   - [ ] Check /pages/auth/agent/ pages
   - [ ] Check /pages/agent/ protected pages
   - [ ] Create missing agent pages

6. **Verify Admin Pages**
   - [ ] Check all pages in /pages/admin/
   - [ ] Create missing admin pages

7. **Verify Customer Pages**
   - [ ] Check remaining pages in /pages/auth/customer/
   - [ ] Check /pages/portal/ pages
   - [ ] Create missing customer pages

8. **Route Organization**
   - [ ] Consider consolidating duplicate ticket detail pages
   - [ ] Ensure consistent naming convention across all pages
   - [ ] Update imports to use consistent paths

9. **Layout Verification**
   - [ ] Verify AdminLayout exists and is properly configured
   - [ ] Verify AgentLayout exists and is properly configured
   - [ ] Verify PortalLayout exists and is properly configured

## Next Steps
1. Verify each unknown component's existence
2. Create list of missing components
3. Prioritize which missing components to implement first
4. Start with fixing the ticket detail routes as they affect all user types 