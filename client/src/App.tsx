import { useEffect, FC } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useUserStore } from '@/stores/userStore';
import { useTicketStore } from '@/stores/ticketStore';
import { Toaster } from '@/components/ui';
import type { UserState } from '@/stores/userStore';

// Layouts
import {
  AdminLayout,
  AgentLayout,
  PortalLayout} from '@/components/layout';

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ResetPassword from '@/pages/auth/ResetPassword';

// Team Auth
import TeamLogin from '@/pages/auth/team/Login';
import TeamCreateAccount from '@/pages/auth/team/CreateAccount';

// Customer Auth
import CustomerLogin from '@/pages/auth/customer/Login';
import CustomerRegister from '@/pages/auth/customer/Register';

// Organization Pages
import OrganizationNew from '@/pages/org/New';
import CustomerInvite from '@/pages/org/CustomerInvite';
import AgentInvite from '@/pages/org/AgentInvite';

// Admin Pages
import DashboardPage from '@/pages/admin/dashboard';
import TicketsPage from '@/pages/admin/tickets';
import AdminTicketDetailsPage from '@/pages/admin/tickets/[id]';
import ManageAgentsPage from '@/pages/admin/manage-agents';
import UsersPage from '@/pages/admin/users';
import AnalyticsPage from '@/pages/admin/analytics';
import SettingsPage from '@/pages/admin/settings';
import InviteCustomersPage from '@/pages/admin/invite-customers';

// Agent Pages
import AgentDashboardPage from '@/pages/agent/dashboard';
import AgentTicketListPage from '@/pages/agent/ticket-list';
import AgentTicketDetailsPage from '@/pages/agent/tickets/[id]';
import TicketQueuePage from '@/pages/agent/queue';
import AssignedTicketsPage from '@/pages/agent/assigned';

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
  const location = useLocation();
  const checkAuth = useUserStore((state: UserState) => state.checkAuth);
  const { setupTicketSubscription, cleanup, fetchTickets } = useTicketStore();
  const { currentUser } = useUserStore();

  // Handle auth check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle ticket subscription and data fetching
  useEffect(() => {
    if (currentUser?.organization_id) {
      const cleanupSubscription = setupTicketSubscription();
      fetchTickets();

      return () => {
        cleanup();
        cleanupSubscription();
      };
    }
  }, [currentUser?.organization_id, location.pathname]);

  // Reset scroll position on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <Toaster />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/org/new" element={<OrganizationNew />} />
          <Route path="/org/:orgId/invite/customer/:token" element={<CustomerInvite />} />
          <Route path="/org/:orgId/invite/agent/:token" element={<AgentInvite />} />

          {/* Auth Routes */}
          <Route path="/auth">
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>

          {/* Team Auth Routes */}
          <Route path="/auth/team">
            <Route path="login" element={<TeamLogin />} />
            <Route path="create-account" element={<TeamCreateAccount />} />
          </Route>

          {/* Customer Auth Routes */}
          <Route path="/auth/customer">
            <Route path="login" element={<CustomerLogin />} />
            <Route path="register" element={<CustomerRegister />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin', 'head_admin']}>
                <AdminLayout>
                  <Outlet />
                </AdminLayout>
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="tickets/:id" element={<AdminTicketDetailsPage />} />
            <Route path="agents" element={<ManageAgentsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="invite-customers" element={<InviteCustomersPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Agent Routes */}
          <Route
            path="/agent"
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <AgentLayout>
                  <Outlet />
                </AgentLayout>
              </ProtectedRoute>
            }
          >
            <Route index element={<AgentDashboardPage />} />
            <Route path="tickets" element={<AgentTicketListPage />} />
            <Route path="tickets/:id" element={<AgentTicketDetailsPage />} />
            <Route path="queue" element={<TicketQueuePage />} />
            <Route path="assigned" element={<AssignedTicketsPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Customer Portal Routes */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <PortalLayout>
                  <Outlet />
                </PortalLayout>
              </ProtectedRoute>
            }
          >
            <Route index element={<CustomerPortal />} />
            <Route path="tickets" element={<CustomerTickets />} />
            <Route path="tickets/:id" element={<TicketDetails />} />
            <Route path="kb" element={<KnowledgeBase />} />
            <Route path="support" element={<Support />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </QueryClientProvider>
  );
};

export default App;