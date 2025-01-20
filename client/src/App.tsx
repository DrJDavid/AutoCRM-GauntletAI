import { useEffect } from 'react';
import { Switch, Route, Redirect, Link } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useUserStore } from '@/stores/userStore';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import Dashboard from '@/pages/Dashboard';
import TicketListPage from '@/pages/TicketListPage';
import TicketDetailPage from '@/pages/TicketDetailPage';
import CustomerPortal from '@/pages/CustomerPortal';
import NotFound from '@/pages/not-found';
import type { UserRole } from '@/types';

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
    return <Redirect to="/login" />;
  }

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Redirect to="/unauthorized" />;
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
        <Route path="/" component={() => (
          <PublicLayout>
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
              <div className="max-w-3xl w-full space-y-6 text-center">
                <h1 className="text-4xl font-bold tracking-tight">Welcome to AutoCRM</h1>
                <p className="text-xl text-gray-600">
                  Your modern customer support solution
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/login">
                    <Button size="lg">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="lg" variant="outline">Register</Button>
                  </Link>
                </div>
              </div>
            </div>
          </PublicLayout>
        )} />
        <Route path="/login" component={() => (
          <PublicLayout>
            <div>Login Page</div>
          </PublicLayout>
        )} />
        <Route path="/register" component={() => (
          <PublicLayout>
            <div>Register Page</div>
          </PublicLayout>
        )} />
        <Route path="/reset-password" component={() => (
          <PublicLayout>
            <div>Reset Password Page</div>
          </PublicLayout>
        )} />
        <Route path="/kb" component={() => (
          <PublicLayout>
            <div>Public Knowledge Base</div>
          </PublicLayout>
        )} />

        {/* Customer Portal Routes */}
        <Route path="/portal">
          <Route path="/dashboard" component={() => (
            <ProtectedRoute allowedRoles={['customer']}>
              <AgentLayout>
                <CustomerPortal />
              </AgentLayout>
            </ProtectedRoute>
          )} />
          <Route path="/tickets/new" component={() => (
            <ProtectedRoute allowedRoles={['customer']}>
              <AgentLayout>
                <div>New Ticket Form</div>
              </AgentLayout>
            </ProtectedRoute>
          )} />
          <Route path="/tickets/:id" component={() => (
            <ProtectedRoute allowedRoles={['customer']}>
              <AgentLayout>
                <TicketDetailPage />
              </AgentLayout>
            </ProtectedRoute>
          )} />
        </Route>

        {/* Agent Routes */}
        <Route path="/agent">
          <Route path="/dashboard" component={() => (
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentLayout>
                <Dashboard />
              </AgentLayout>
            </ProtectedRoute>
          )} />
          <Route path="/tickets/queue" component={() => (
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentLayout>
                <TicketListPage />
              </AgentLayout>
            </ProtectedRoute>
          )} />
          <Route path="/tickets/:id" component={() => (
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentLayout>
                <TicketDetailPage />
              </AgentLayout>
            </ProtectedRoute>
          )} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin">
          <Route path="/dashboard" component={() => (
            <ProtectedRoute allowedRoles={['admin']}>
              <AgentLayout>
                <Dashboard />
              </AgentLayout>
            </ProtectedRoute>
          )} />
          <Route path="/tickets/all" component={() => (
            <ProtectedRoute allowedRoles={['admin']}>
              <AgentLayout>
                <TicketListPage />
              </AgentLayout>
            </ProtectedRoute>
          )} />
          <Route path="/settings" component={() => (
            <ProtectedRoute allowedRoles={['admin']}>
              <AgentLayout>
                <div>Settings Page</div>
              </AgentLayout>
            </ProtectedRoute>
          )} />
        </Route>

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