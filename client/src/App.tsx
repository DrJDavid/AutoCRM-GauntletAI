import { useEffect, lazy, FC } from 'react';
import { Switch, Route, Link } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabaseClient';
import { Toaster } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { AgentLayout } from '@/components/layout/AgentLayout';
import { InviteManagement } from '@/components/InviteManagement';
import { useTicketStore } from '@/stores/ticketStore';
import { create } from 'zustand';

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
import type { DbProfile } from '@/types/database';
type UserRole = DbProfile['role'];

// Placeholder Components
const OrganizationInvite = () => <div>Organization Invite Page</div>;
const OrganizationSettings = () => <div>Organization Settings Page</div>;
const TicketList = () => <div>Ticket List</div>;
const TicketDetail = () => <div>Ticket Detail</div>;

// New routes
import Landing from '@/pages/Landing';
import TeamJoin from '@/pages/auth/team/join';
import CustomerPortal from '@/pages/portal';
import TicketDetails from '@/pages/portal/tickets/[id]';
import KnowledgeBase from '@/pages/portal/kb';
import Support from '@/pages/portal/support';
import CustomerInvite from '@/pages/org/CustomerInvite';
import AgentInvite from '@/pages/org/AgentInvite';

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminTickets from '@/pages/admin/tickets';
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
import CustomerTickets from '@/pages/portal/tickets';

// Layouts
import AdminLayout from '@/components/layout/AdminLayout';

// Protected route wrapper
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface UserState {
  currentUser: DbProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

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
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />

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
          <Route path="/auth/team/join" component={TeamJoin} />
          <Route path="/auth/team/join-request" component={TeamJoinRequest} />
          <Route path="/auth/team/create-account" component={TeamCreateAccount} />
          
          {/* Agent Routes */}
          <Route path="/auth/agent/login" component={AgentLogin} />
          <Route path="/auth/agent/register" component={AgentRegister} />
          
          {/* Customer Routes */}
          <Route path="/auth/customer/accept-invite" component={CustomerAcceptInvite} />
          <Route path="/auth/customer/login" component={CustomerLogin} />
          <Route path="/auth/customer/register" component={CustomerRegister} />

          {/* Protected Routes */}
          <Route path="/admin/*">
            <ProtectedRoute allowedRoles={['admin', 'head_admin']}>
              <AdminLayout>
                <Switch>
                  <Route path="/admin" component={AdminDashboard} />
                  <Route path="/admin/tickets" component={AdminTickets} />
                  <Route path="/admin/tickets/:id" component={AgentTicketDetailsPage} />
                  <Route path="/admin/agents" component={ManageAgents} />
                  <Route path="/admin/users" component={UserManagement} />
                  <Route path="/admin/analytics" component={AdminAnalytics} />
                  <Route path="/admin/settings" component={AdminSettings} />
                  <Route path="/admin/invite-customers" component={InviteCustomers} />
                  <Route path="*" component={NotFound} />
                </Switch>
              </AdminLayout>
            </ProtectedRoute>
          </Route>

          {/* Agent Protected Routes */}
          <Route path="/agent/*">
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentLayout>
                <Switch>
                  <Route path="/agent" component={AgentDashboard} />
                  <Route path="/agent/tickets" component={AgentTickets} />
                  <Route path="/agent/tickets/:id" component={AgentTicketDetailsPage} />
                  <Route path="/agent/queue" component={TicketQueue} />
                  <Route path="/agent/assigned" component={AssignedTickets} />
                  <Route path="*" component={NotFound} />
                </Switch>
              </AgentLayout>
            </ProtectedRoute>
          </Route>

          {/* Customer Protected Routes */}
          <Route path="/portal">
            <ProtectedRoute allowedRoles={['customer']}>
              <PortalLayout>
                <Switch>
                  <Route path="/portal" component={CustomerPortal} />
                  <Route path="/portal/tickets" component={CustomerTickets} />
                  <Route path="/portal/tickets/:id" component={TicketDetails} />
                  <Route path="/portal/kb" component={KnowledgeBase} />
                  <Route path="/portal/support" component={Support} />
                  <Route component={NotFound} />
                </Switch>
              </PortalLayout>
            </ProtectedRoute>
          </Route>

          {/* Protected Organization Routes */}
          <Route path="/org/customers/invite">
            <ProtectedRoute allowedRoles={['admin', 'head_admin']}>
              <CustomerInvite />
            </ProtectedRoute>
          </Route>
          <Route path="/org/agents/invite">
            <ProtectedRoute allowedRoles={['admin', 'head_admin']}>
              <AgentInvite />
            </ProtectedRoute>
          </Route>

          {/* Catch-all route for 404 */}
          <Route path="*" component={NotFound} />
        </Switch>
      </div>
    </QueryClientProvider>
  );
};

export default App;