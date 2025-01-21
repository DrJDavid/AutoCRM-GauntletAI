# AutoCRM User Journeys & Routing

## 🔐 Initial Access Flows

### Organization Creation (Admin Path)
```
/org
├── /new           # Create new organization + admin account
│   ├── Step 1: Organization details
│   ├── Step 2: Admin account creation
│   └── Step 3: Initial setup wizard
└── /login         # Existing organization signin
```

### Team Member Access (Agents)
```
/auth/team
├── /accept-invite  # Accept invite from admin [Primary Path]
│   ├── Step 1: Verify invite token
│   ├── Step 2: Create account
│   └── Step 3: Access organization
└── /login          # Existing team member login
```

### Customer Access
```
/auth/customer
├── /accept-invite   # Accept invite from admin/agent [Primary Path]
│   ├── Step 1: Verify invite token
│   ├── Step 2: Create customer account
│   └── Step 3: Access customer portal
├── /login          # Existing customer login
└── /portal         # Customer portal access
```

## 🌟 Key Principles

### Organization-First Approach
- Every user must be associated with an organization
- Organizations can only be created through the explicit org creation flow
- Team members (agents) can only be added by admin invitation
- Customers can only be added by admin/agent invitation

### Role Assignment
- Organization creator automatically becomes admin
- Team members are assigned agent role upon invite acceptance
- Customers are assigned customer role upon invite acceptance

### Access Control
- Admins: Full organization management
- Agents: Customer and ticket management
- Customers: Limited to their portal and tickets

## 🔄 User Flows

### New Organization Setup
1. Admin visits /org/new
2. Creates organization
3. Creates admin account
4. Completes setup wizard
5. Can then invite team members and customers

### Team Member Onboarding
1. Admin sends invite to team member
2. Team member receives invite email
3. Clicks invite link to /auth/team/accept-invite
4. Creates account with verified email
5. Gets immediate access as agent

### Customer Onboarding
1. Admin/Agent sends invite to customer
2. Customer receives invite email
3. Clicks invite link to /auth/customer/accept-invite
4. Creates account with verified email
5. Gets immediate access to customer portal

## 👑 Admin Journey

### Dashboard & Overview
```