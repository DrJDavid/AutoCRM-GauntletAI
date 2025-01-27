import { useEffect, lazy } from 'react';
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
import type { Profile } from '@/types';
type UserRole = Profile['role'];

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

// Layouts
import AdminLayout from '@/components/layout/AdminLayout';
import AgentDashboard from '@/pages/agent/dashboard';
import AgentAssigned from '@/pages/agent/assigned';
import AgentQueue from '@/pages/agent/queue';
import { AgentTicketDetailsPage } from '@/pages/agent/tickets/[id]';

// Protected route wrapper
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

function App() {
  const checkAuth = useUserStore((state) => state.checkAuth);
  const { setupTicketSubscription, cleanup } = useTicketStore();
  const currentUser = useUserStore((state) => state.currentUser);

  useEffect(() => {
    // Initial auth check
    useUserStore.getState().checkAuth();
  }, []);

  useEffect(() => {
    // Initial auth check only if we don't have a user
    if (!useUserStore.getState().currentUser) {
      checkAuth();
    }
  }, [checkAuth]);

  // Set up ticket subscription when user is authenticated
  useEffect(() => {
    if (currentUser) {
      setupTicketSubscription();
    }
    return () => cleanup();
  }, [currentUser, setupTicketSubscription, cleanup]);

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      // Only update state for sign in/out events
      switch (event) {
        case 'SIGNED_IN':
          // Only check auth if we don't have a user and it's not an initial session
          if (!useUserStore.getState().currentUser && event !== 'INITIAL_SESSION') {
            await checkAuth();
          }
          break;
        case 'SIGNED_OUT':
          useUserStore.setState({ 
            currentUser: null, 
            isAuthenticated: false,
            isLoading: false,
            error: null 
          });
          break;
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array since checkAuth is stable

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <Toaster />
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
          
          {/* Agent Routes */}
          <Route path="/auth/agent/login" component={AgentLogin} />
          <Route path="/auth/agent/register" component={AgentRegister} />
          
          {/* Customer Routes */}
          <Route path="/auth/customer/accept-invite" component={CustomerAcceptInvite} />
          <Route path="/auth/customer/login" component={CustomerLogin} />
          <Route path="/auth/customer/register" component={CustomerRegister} />

          {/* Customer Portal - Protected */}
          <Route path="/portal">
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerPortal />
            </ProtectedRoute>
          </Route>
          <Route path="/portal/tickets/:id">
            <ProtectedRoute allowedRoles={['customer']}>
              <TicketDetails />
            </ProtectedRoute>
          </Route>
          <Route path="/portal/kb">
            <ProtectedRoute allowedRoles={['customer']}>
              <KnowledgeBase />
            </ProtectedRoute>
          </Route>
          <Route path="/portal/support">
            <ProtectedRoute allowedRoles={['customer']}>
              <Support />
            </ProtectedRoute>
          </Route>

          {/* Protected Organization Routes */}
          <Route path="/org/customers/invite">
            <ProtectedRoute allowedRoles={['admin']}>
              <CustomerInvite />
            </ProtectedRoute>
          </Route>
          <Route path="/org/agents/invite">
            <ProtectedRoute allowedRoles={['admin']}>
              <AgentInvite />
            </ProtectedRoute>
          </Route>

          {/* Admin Routes */}
          <Route path="/admin">
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/admin/dashboard">
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          </Route>
          <Route path="/admin/tickets">
            <ProtectedRoute allowedRoles={['admin', 'agent']}>
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

          {/* Agent Routes */}
          <Route path="/agent">
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentLayout>
                <AgentDashboard />
              </AgentLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/agent/dashboard">
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentLayout>
                <AgentDashboard />
              </AgentLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/agent/assigned">
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentLayout>
                <AgentAssigned />
              </AgentLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/agent/queue">
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentLayout>
                <AgentQueue />
              </AgentLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/agent/tickets/:id">
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentLayout>
                <AgentTicketDetailsPage />
              </AgentLayout>
            </ProtectedRoute>
          </Route>

          {/* 404 Route */}
          <Route component={NotFound} />
        </Switch>
      </div>
    </QueryClientProvider>
  );
}

export default App;