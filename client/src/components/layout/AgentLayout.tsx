import { FC } from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, TicketCheck, ListChecks, CheckSquare, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/userStore';

interface Props {
  children: React.ReactNode;
  className?: string;
}

interface SidebarItem {
  icon: any;
  label: string;
  href: string;
}

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/agent' },
  { icon: TicketCheck, label: 'Tickets', href: '/agent/tickets' },
  { icon: ListChecks, label: 'Queue', href: '/agent/queue' },
  { icon: CheckSquare, label: 'Assigned', href: '/agent/assigned' },
];

export const AgentLayout: FC<Props> = ({ children, className }) => {
  const [location, setLocation] = useLocation();
  const { logout } = useUserStore();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold">AutoCRM</h1>
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  location === item.href 
                    ? "bg-gray-800 text-white" 
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-800">
          <Button 
            variant="ghost" 
            size="sm"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("flex-1 overflow-auto", className)}>
        {children}
      </div>
    </div>
  );
};
