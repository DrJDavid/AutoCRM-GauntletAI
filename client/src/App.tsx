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

// Auth Pages
import TeamLogin from '@/pages/auth/team/Login';
import TeamRegister from '@/pages/auth/team/Register';
import TeamAcceptInvite from '@/pages/auth/team/AcceptInvite';
import TeamJoinRequest from '@/pages/auth/team/TeamJoinRequest';
import TeamCreateAccount from '@/pages/auth/team/CreateAccount';
import CustomerLogin from '@/pages/auth/customer/Login';
import CustomerRegister from '@/pages/auth/customer/Register';
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

function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const { currentUser, isAuthenticated, isLoading } = useUserStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Link href="/auth/team/login" />;
  }

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Link href="/unauthorized" />;
  }

  return <>{children}</>;
}

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
  const { checkAuth } = useUserStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Landing} />
        
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
        <Route path="/auth/reset-password" component={ResetPassword} />

        {/* Customer Portal */}
        <Route path="/portal" component={CustomerPortal} />
        <Route path="/portal/kb" component={KnowledgeBase} />
        <Route path="/portal/support" component={Support} />

        {/* Protected Organization Routes */}
        <Route path="/org/customers/invite" component={() => (
          <ProtectedRoute allowedRoles={['admin', 'agent']}>
            <AgentLayout>
              <CustomerInvite />
            </AgentLayout>
          </ProtectedRoute>
        )} />

        <Route path="/org/agents/invite" component={() => (
          <ProtectedRoute allowedRoles={['admin']}>
            <AgentLayout>
              <AgentInvite />
            </AgentLayout>
          </ProtectedRoute>
        )} />

        {/* Protected Admin Routes */}
        <Route path="/admin/dashboard" component={() => (
          <ProtectedRoute allowedRoles={['admin']}>
            <AgentLayout>
              <AdminDashboard />
            </AgentLayout>
          </ProtectedRoute>
        )} />

        {/* Protected Agent Routes */}
        <Route path="/agent/dashboard" component={() => (
          <ProtectedRoute allowedRoles={['agent']}>
            <AgentLayout>
              <AgentDashboard />
            </AgentLayout>
          </ProtectedRoute>
        )} />

        {/* Protected Customer Routes */}
        <Route path="/portal/tickets/:id" component={() => (
          <ProtectedRoute allowedRoles={['customer']}>
            <PortalLayout>
              <TicketDetail />
            </PortalLayout>
          </ProtectedRoute>
        )} />

        {/* Customer Auth Routes */}
        <Route path="/auth/customer/accept-invite" component={CustomerAcceptInvite} />
        
        {/* Agent Auth Routes */}
        <Route path="/auth/agent/accept-invite" component={lazy(() => import('@/pages/auth/agent/AcceptInvite'))} />

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