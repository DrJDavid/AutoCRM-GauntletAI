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
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ResetPassword from '@/pages/auth/ResetPassword';
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
                      Streamline your customer support operations with our intuitive ticket management system. Handle inquiries efficiently and provide exceptional service.
                    </p>
                    <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                      <div className="rounded-md shadow">
                        <Link href="/register">
                          <Button size="lg" className="w-full sm:w-auto">
                            Get Started
                          </Button>
                        </Link>
                      </div>
                      <div className="mt-3 sm:mt-0 sm:ml-3">
                        <Link href="/login">
                          <Button size="lg" variant="outline" className="w-full sm:w-auto">
                            Sign In
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Section */}
              <div className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Feature 1 */}
                    <div className="relative p-6 bg-white border rounded-lg shadow-sm">
                      <h3 className="text-lg font-medium text-gray-900">
                        Ticket Management
                      </h3>
                      <p className="mt-2 text-base text-gray-500">
                        Efficiently manage and track customer support tickets from creation to resolution.
                      </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="relative p-6 bg-white border rounded-lg shadow-sm">
                      <h3 className="text-lg font-medium text-gray-900">
                        Customer Portal
                      </h3>
                      <p className="mt-2 text-base text-gray-500">
                        Empower customers with self-service options and ticket tracking capabilities.
                      </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="relative p-6 bg-white border rounded-lg shadow-sm">
                      <h3 className="text-lg font-medium text-gray-900">
                        Analytics Dashboard
                      </h3>
                      <p className="mt-2 text-base text-gray-500">
                        Gain insights into support performance with comprehensive analytics and reporting.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PublicLayout>
        )} />

        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/reset-password" component={ResetPassword} />
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