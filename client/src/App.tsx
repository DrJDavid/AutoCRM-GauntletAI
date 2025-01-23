import { useEffect, lazy } from 'react';
import { Switch, Route, Link } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useUserStore } from '@/stores/userStore';
import { Toaster } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { InviteManagement } from '@/components/InviteManagement';

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import TeamLogin from '@/pages/auth/team/Login';
import TeamRegister from '@/pages/auth/team/Register';
import TeamAcceptInvite from '@/pages/auth/team/AcceptInvite';
import TeamJoinRequest from '@/pages/auth/team/TeamJoinRequest';
import TeamCreateAccount from '@/pages/auth/team/CreateAccount';
import CustomerLogin from '@/pages/auth/customer/Login';
import CustomerRegister from '@/pages/auth/customer/Register';
import AgentLogin from '@/pages/auth/agent/Login';
import AgentRegister from '@/pages/auth/agent/Register';
import ResetPassword from '@/pages/auth/ResetPassword';
import CustomerAcceptInvite from '@/pages/auth/customer/AcceptInvite';

// Organization Pages
import OrganizationNew from '@/pages/org/New';
import OrganizationLogin from '@/pages/org/Login';
import OrganizationSetup from '@/pages/org/Setup';
import NotFound from '@/pages/not-found';

// Types
import type { UserRole } from '@/types';

// Placeholder Components
const OrganizationInvite = () => <div>Organization Invite Page</div>;
const OrganizationSettings = () => <div>Organization Settings Page</div>;
const AdminDashboard = () => <div>Admin Dashboard</div>;
const AgentDashboard = () => <div>Agent Dashboard</div>;
const TicketList = () => <div>Ticket List</div>;
const TicketDetail = () => <div>Ticket Detail</div>;

// New routes
import Landing from '@/pages/Landing';
import TeamJoin from '@/pages/auth/team/join';
import CustomerPortal from '@/pages/portal';
import KnowledgeBase from '@/pages/portal/kb';
import Support from '@/pages/portal/support';
import CustomerInvite from '@/pages/org/CustomerInvite';
import AgentInvite from '@/pages/org/AgentInvite';

// Admin Pages
import AdminTickets from '@/pages/admin/tickets';
import AdminAnalytics from '@/pages/admin/analytics';
import AdminSettings from '@/pages/admin/settings';
import UserManagement from '@/pages/admin/users';
import InviteCustomers from '@/pages/admin/invite-customers';
import ManageAgents from '@/pages/admin/manage-agents';

// Layouts
import AdminLayout from '@/components/layout/AdminLayout';

// Protected route wrapper
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <aside className="hidden md:block w-64">
          <Sidebar />
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
      <Footer />
    </div>
  );
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

function App() {
  const checkAuth = useUserStore(state => state.checkAuth);

  useEffect(() => {
    // Call checkAuth when the component mounts
    checkAuth();
  }, []); // Empty dependency array since we only want this to run once

  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Landing} />

        {/* Auth Routes */}
        <Route path="/auth/reset-password" component={ResetPassword} />
        <Route path="/auth/reset-password/confirm" component={ResetPassword} />

        {/* Organization Routes */}
        <Route path="/org/new" component={OrganizationNew} />
        <Route path="/org/login" component={OrganizationLogin} />
        <Route path="/org/setup" component={OrganizationSetup} />
        
        {/* Team Member Routes */}
        <Route path="/auth/team/accept-invite" component={TeamAcceptInvite} />
        <Route path="/auth/team/login" component={TeamLogin} />
        
        {/* Customer Routes */}
        <Route path="/auth/customer/accept-invite" component={CustomerAcceptInvite} />
        <Route path="/auth/customer/login" component={CustomerLogin} />
        <Route path="/auth/customer/register" component={CustomerRegister} />

        {/* Customer Portal - Protected */}
        <Route path="/portal">
          <ProtectedRoute allowedRoles={['customer']}>
            <PortalLayout>
              <CustomerPortal />
            </PortalLayout>
          </ProtectedRoute>
        </Route>
        <Route path="/portal/kb">
          <ProtectedRoute allowedRoles={['customer']}>
            <PortalLayout>
              <KnowledgeBase />
            </PortalLayout>
          </ProtectedRoute>
        </Route>
        <Route path="/portal/support">
          <ProtectedRoute allowedRoles={['customer']}>
            <PortalLayout>
              <Support />
            </PortalLayout>
          </ProtectedRoute>
        </Route>

        {/* Protected Organization Routes */}
        <Route path="/org/customers/invite">
          <ProtectedRoute allowedRoles={['admin', 'agent']}>
            <AdminLayout>
              <CustomerInvite />
            </AdminLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/org/agents/invite">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <AgentInvite />
            </AdminLayout>
          </ProtectedRoute>
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/dashboard">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/tickets">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <AdminTickets />
            </AdminLayout>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/analytics">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <AdminAnalytics />
            </AdminLayout>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/settings">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/users">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <UserManagement />
            </AdminLayout>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/invite-customers">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <InviteCustomers />
            </AdminLayout>
          </ProtectedRoute>
        </Route>
        <Route path="/admin/manage-agents">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <ManageAgents />
            </AdminLayout>
          </ProtectedRoute>
        </Route>

        {/* Protected Customer Routes */}
        <Route path="/portal/tickets/:id" component={() => (
          <ProtectedRoute allowedRoles={['customer']}>
            <PortalLayout>
              <TicketDetail />
            </PortalLayout>
          </ProtectedRoute>
        )} />

        {/* Invite Routes */}
        <Route path="/invites" element={
          <ProtectedRoute>
            <InviteManagement />
          </ProtectedRoute>
        } />

        {/* Fallback Routes */}
        <Route path="/unauthorized" component={() => (
          <PublicLayout>
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Unauthorized Access</h1>
                <p className="text-gray-600">
                  You don't have permission to access this page.
                </p>
              </div>
            </div>
          </PublicLayout>
        )} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;