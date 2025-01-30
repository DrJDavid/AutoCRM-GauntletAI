import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TicketCheck,
  BarChart3,
  Users,
  Settings,
  LogOut,
  UserPlus,
  Mail
} from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { Button } from '@/components/ui/button';

interface SidebarItem {
  icon: any;
  label: string;
  href: string;
}

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: TicketCheck, label: 'Tickets', href: '/admin/tickets' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: UserPlus, label: 'Manage Agents', href: '/admin/agents' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
  { icon: Mail, label: 'Invite Customers', href: '/admin/invite-customers' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useUserStore();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
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
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  location.pathname === item.href 
                    ? "bg-gray-800 text-white" 
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-800">
          <Button 
            variant="ghost" 
            size="sm"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
} 