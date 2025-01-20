import { useEffect } from 'react';
import { Switch, Route, Redirect } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useUserStore } from '@/stores/userStore';
import { Toaster } from '@/components/ui/toaster';
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
    window.location.href = '/login';
    return null;
  }

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Redirect to="/unauthorized" />;
  }

  return <>{children}</>;
}

function App() {
  const { checkAuth } = useUserStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex">
          <aside className="hidden md:block w-64">
            <Sidebar />
          </aside>
          <main className="flex-1 p-6">
            <Switch>
              {/* Customer Routes */}
              <Route
                path="/customer-portal"
                component={() => (
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerPortal />
                  </ProtectedRoute>
                )}
              />

              {/* Agent Routes */}
              <Route
                path="/tickets"
                component={() => (
                  <ProtectedRoute allowedRoles={['agent', 'admin']}>
                    <TicketListPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/tickets/:id"
                component={() => (
                  <ProtectedRoute allowedRoles={['agent', 'admin']}>
                    <TicketDetailPage />
                  </ProtectedRoute>
                )}
              />

              {/* Admin Routes */}
              <Route
                path="/dashboard"
                component={() => (
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Dashboard />
                  </ProtectedRoute>
                )}
              />

              {/* Public Routes */}
              <Route path="/unauthorized" component={() => (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Unauthorized Access</h1>
                    <p className="text-gray-600">
                      You don't have permission to access this page.
                    </p>
                  </div>
                </div>
              )} />

              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;