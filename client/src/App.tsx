import { useEffect, FC } from 'react';
import { Switch, Route } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useUserStore } from '@/stores/userStore';
import { useTicketStore } from '@/stores/ticketStore';
import { Toaster } from '@/components/ui';

// Layouts
import {
  PublicLayout,
  AdminLayout,
  AgentLayout,
  PortalLayout,
  type LayoutRole
} from '@/components/layout';

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ResetPassword from '@/pages/auth/ResetPassword';

// Team Auth
import TeamLogin from '@/pages/auth/team/Login';
import TeamRegister from '@/pages/auth/team/Register';
import TeamAcceptInvite from '@/pages/auth/team/AcceptInvite';
import TeamJoinRequest from '@/pages/auth/team/TeamJoinRequest';
import TeamCreateAccount from '@/pages/auth/team/CreateAccount';

// Customer Auth
import CustomerLogin from '@/pages/auth/customer/Login';
import CustomerRegister from '@/pages/auth/customer/Register';
import CustomerAcceptInvite from '@/pages/auth/customer/AcceptInvite';

// Agent Auth
import AgentLogin from '@/pages/auth/agent/Login';
import AgentRegister from '@/pages/auth/agent/Register';

// Organization Pages
import OrganizationNew from '@/pages/org/New';
import OrganizationLogin from '@/pages/org/Login';
import OrganizationSetup from '@/pages/org/Setup';
import CustomerInvite from '@/pages/org/CustomerInvite';
import AgentInvite from '@/pages/org/AgentInvite';

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminTickets from '@/pages/admin/tickets';
import AdminTicketDetailsPage from '@/pages/admin/tickets/[id]';
import AdminAnalytics from '@/pages/admin/analytics';
import AdminSettings from '@/pages/admin/settings';
import UserManagement from '@/pages/admin/users';
import InviteCustomers from '@/pages/admin/invite-customers';
import ManageAgents from '@/pages/admin/manage-agents';

// Agent Pages
import AgentDashboard from '@/pages/agent/dashboard';
import AgentTickets from '@/pages/agent/tickets';
import { AgentTicketDetailsPage } from '@/pages/agent/tickets/[id]';
import TicketQueue from '@/pages/agent/queue';
import AssignedTickets from '@/pages/agent/assigned';

// Customer Portal Pages
import CustomerPortal from '@/pages/portal';
import CustomerTickets from '@/pages/portal/tickets';
import TicketDetails from '@/pages/portal/tickets/[id]';
import KnowledgeBase from '@/pages/portal/kb';
import Support from '@/pages/portal/support';

// Shared Pages
import Landing from '@/pages/Landing';
import NotFound from '@/pages/not-found';

// Components
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const App: FC = () => {
  const checkAuth = useUserStore((state) => state.checkAuth);
  const { setupTicketSubscription, cleanup } = useTicketStore();

  useEffect(() => {
    checkAuth();
    setupTicketSubscription();
    return () => cleanup();
  }, [checkAuth, setupTicketSubscription, cleanup]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <Toaster />
        <Switch>
          {/* Public Routes */}
          <Route path="/">
            <PublicLayout>
              <Switch>
                <Route path="/" component={Landing} />
                <Route path="/login" component={Login} />
                <Route path="/register" component={Register} />
                <Route path="/auth/reset-password" component={ResetPassword} />
              </Switch>
            </PublicLayout>
          </Route>

          {/* Organization Setup Routes */}
          <Route path="/org">
            <PublicLayout>
              <Switch>
                <Route path="/org/new" component={OrganizationNew} />
                <Route path="/org/login" component={OrganizationLogin} />
                <Route path="/org/setup" component={OrganizationSetup} />
              </Switch>
            </PublicLayout>
          </Route>

          {/* Team Auth Routes */}
          <Route path="/auth/team">
            <PublicLayout>
              <Switch>
                <Route path="/auth/team/login" component={TeamLogin} />
                <Route path="/auth/team/register" component={TeamRegister} />
                <Route path="/auth/team/accept-invite" component={TeamAcceptInvite} />
                <Route path="/auth/team/join-request" component={TeamJoinRequest} />
                <Route path="/auth/team/create-account" component={TeamCreateAccount} />
              </Switch>
            </PublicLayout>
          </Route>

          {/* Agent Auth Routes */}
          <Route path="/auth/agent">
            <PublicLayout>
              <Switch>
                <Route path="/auth/agent/login" component={AgentLogin} />
                <Route path="/auth/agent/register" component={AgentRegister} />
              </Switch>
            </PublicLayout>
          </Route>

          {/* Customer Auth Routes */}
          <Route path="/auth/customer">
            <PublicLayout>
              <Switch>
                <Route path="/auth/customer/login" component={CustomerLogin} />
                <Route path="/auth/customer/register" component={CustomerRegister} />
                <Route path="/auth/customer/accept-invite" component={CustomerAcceptInvite} />
              </Switch>
            </PublicLayout>
          </Route>

          {/* Admin Protected Routes */}
          <Route path="/admin">
            <ProtectedRoute allowedRoles={['admin', 'head_admin']}>
              <AdminLayout>
                <Switch>
                  <Route path="/admin" component={AdminDashboard} />
                  <Route path="/admin/tickets" component={AdminTickets} />
                  <Route path="/admin/tickets/:id" component={AdminTicketDetailsPage} />
                  <Route path="/admin/agents" component={ManageAgents} />
                  <Route path="/admin/users" component={UserManagement} />
                  <Route path="/admin/analytics" component={AdminAnalytics} />
                  <Route path="/admin/settings" component={AdminSettings} />
                  <Route path="/admin/invite-customers" component={InviteCustomers} />
                </Switch>
              </AdminLayout>
            </ProtectedRoute>
          </Route>

          {/* Agent Protected Routes */}
          <Route path="/agent">
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentLayout>
                <Switch>
                  <Route path="/agent" component={AgentDashboard} />
                  <Route path="/agent/tickets" component={AgentTickets} />
                  <Route path="/agent/tickets/:id" component={AgentTicketDetailsPage} />
                  <Route path="/agent/queue" component={TicketQueue} />
                  <Route path="/agent/assigned" component={AssignedTickets} />
                </Switch>
              </AgentLayout>
            </ProtectedRoute>
          </Route>

          {/* Customer Portal Protected Routes */}
          <Route path="/portal">
            <ProtectedRoute allowedRoles={['customer']}>
              <PortalLayout>
                <Switch>
                  <Route path="/portal" component={CustomerPortal} />
                  <Route path="/portal/tickets" component={CustomerTickets} />
                  <Route path="/portal/tickets/:id" component={TicketDetails} />
                  <Route path="/portal/kb" component={KnowledgeBase} />
                  <Route path="/portal/support" component={Support} />
                </Switch>
              </PortalLayout>
            </ProtectedRoute>
          </Route>

          {/* Protected Organization Routes */}
          <Route path="/org">
            <ProtectedRoute allowedRoles={['admin', 'head_admin']}>
              <AdminLayout>
                <Switch>
                  <Route path="/org/customers/invite" component={CustomerInvite} />
                  <Route path="/org/agents/invite" component={AgentInvite} />
                </Switch>
              </AdminLayout>
            </ProtectedRoute>
          </Route>

          {/* Catch-all route for 404 */}
          <Route component={NotFound} />
        </Switch>
      </div>
    </QueryClientProvider>
  );
};

export default App;