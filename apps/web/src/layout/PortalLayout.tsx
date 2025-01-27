import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, LogOut } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/components/ui/use-toast';

interface PortalLayoutProps {
  children: React.ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const [, setLocation] = useLocation();
  const { logout } = useUserStore();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Single Navigation Header */}
      <header className="bg-white border-b">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side navigation */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/portal')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Portal
              </Button>
            </div>

            {/* Right side navigation */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/portal/kb')}
              >
                Knowledge Base
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/portal/support')}
              >
                Contact Support
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}