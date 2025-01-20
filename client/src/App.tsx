import { useEffect } from 'react';
import { Switch, Route, Link } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useUserStore } from '@/stores/userStore';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';

// Auth Pages
import TeamLogin from '@/pages/auth/team/Login';
import TeamRegister from '@/pages/auth/team/Register';
import TeamAcceptInvite from '@/pages/auth/team/AcceptInvite';
import CustomerLogin from '@/pages/auth/customer/Login';
import CustomerRegister from '@/pages/auth/customer/Register';

// Organization Pages
import OrganizationSetup from '@/pages/org/Setup';
import NotFound from '@/pages/not-found';

// Types
import type { UserRole } from '@/types';

// Placeholder Components
const OrganizationInvite = () => <div>Organization Invite Page</div>;
const OrganizationSettings = () => <div>Organization Settings Page</div>;
const AdminDashboard = () => <div>Admin Dashboard</div>;
const AgentDashboard = () => <div>Agent Dashboard</div>;
const CustomerPortal = () => <div>Customer Portal</div>;
const TicketList = () => <div>Ticket List</div>;
const TicketDetail = () => <div>Ticket Detail</div>;

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
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={() => (
          <PublicLayout>
            <div className="min-h-screen flex flex-col items-center">
              {/* Hero Section */}
              <div className="w-full bg-gradient-to-b from-white to-gray-50 border-b">
                <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
                  <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                      <span className="block">Modern Customer Support</span>
                      <span className="block text-primary">Made Simple</span>
                    </h1>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                      Streamline your customer support operations with our intuitive ticket management system.
                    </p>
                    <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                      <div className="rounded-md shadow">
                        <Link href="/auth/team/register">
                          <Button size="lg" className="w-full sm:w-auto">
                            Create Organization
                          </Button>
                        </Link>
                      </div>
                      <div className="mt-3 sm:mt-0 sm:ml-3">
                        <Link href="/auth/customer/register">
                          <Button size="lg" variant="outline" className="w-full sm:w-auto">
                            Customer Sign Up
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PublicLayout>
        )} />

        {/* Auth Routes */}
        <Route path="/auth/team/login" component={TeamLogin} />
        <Route path="/auth/team/register" component={TeamRegister} />
        <Route path="/auth/team/accept-invite" component={TeamAcceptInvite} />
        <Route path="/auth/customer/login" component={CustomerLogin} />
        <Route path="/auth/customer/register" component={CustomerRegister} />

        {/* Organization Setup & Management */}
        <Route path="/org/setup" component={() => (
          <ProtectedRoute allowedRoles={['admin']}>
            <AgentLayout>
              <OrganizationSetup />
            </AgentLayout>
          </ProtectedRoute>
        )} />
        <Route path="/org/invite" component={() => (
          <ProtectedRoute allowedRoles={['admin']}>
            <AgentLayout>
              <OrganizationInvite />
            </AgentLayout>
          </ProtectedRoute>
        )} />
        <Route path="/org/settings" component={() => (
          <ProtectedRoute allowedRoles={['admin']}>
            <AgentLayout>
              <OrganizationSettings />
            </AgentLayout>
          </ProtectedRoute>
        )} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" component={() => (
          <ProtectedRoute allowedRoles={['admin']}>
            <AgentLayout>
              <AdminDashboard />
            </AgentLayout>
          </ProtectedRoute>
        )} />

        {/* Agent Routes */}
        <Route path="/agent/dashboard" component={() => (
          <ProtectedRoute allowedRoles={['agent']}>
            <AgentLayout>
              <AgentDashboard />
            </AgentLayout>
          </ProtectedRoute>
        )} />
        <Route path="/agent/tickets" component={() => (
          <ProtectedRoute allowedRoles={['agent']}>
            <AgentLayout>
              <TicketList />
            </AgentLayout>
          </ProtectedRoute>
        )} />

        {/* Customer Routes */}
        <Route path="/portal/dashboard" component={() => (
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerPortal />
          </ProtectedRoute>
        )} />
        <Route path="/portal/tickets/:id" component={TicketDetail} />

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