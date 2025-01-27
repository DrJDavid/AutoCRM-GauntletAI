import { Link, useLocation } from 'wouter';
import { useUserStore } from '@/stores/userStore';
import {
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  HelpCircle,
  Plus,
  List,
  InboxIcon,
  FileText,
  BarChart,
  UserPlus,
  UserCog,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import type { UserRole } from '@/types';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
};

const navigation: NavigationItem[] = [
  // Customer Portal Navigation
  { 
    name: 'My Dashboard', 
    href: '/portal/dashboard', 
    icon: LayoutDashboard,
    roles: ['customer']
  },
  { 
    name: 'Submit Ticket', 
    href: '/portal/tickets/new', 
    icon: Plus,
    roles: ['customer']
  },
  { 
    name: 'My Tickets', 
    href: '/portal/tickets', 
    icon: Ticket,
    roles: ['customer']
  },
  { 
    name: 'Knowledge Base', 
    href: '/portal/kb', 
    icon: FileText,
    roles: ['customer']
  },

  // Admin Navigation
  { 
    name: 'Admin Dashboard', 
    href: '/admin/dashboard', 
    icon: LayoutDashboard,
    roles: ['admin']
  },
  { 
    name: 'All Tickets', 
    href: '/admin/tickets/all', 
    icon: List,
    roles: ['admin']
  },
  { 
    name: 'Analytics', 
    href: '/admin/tickets/analytics', 
    icon: BarChart,
    roles: ['admin']
  },
  { 
    name: 'User Management', 
    href: '/admin/users', 
    icon: Users,
    roles: ['admin']
  },
  { 
    name: 'Settings', 
    href: '/admin/settings', 
    icon: Settings,
    roles: ['admin']
  },
  {
    name: 'Manage Agents',
    href: '/admin/manage-agents',
    icon: UserCog,
    roles: ['admin'],
  },

  // Agent Navigation
  { 
    name: 'Dashboard', 
    href: '/agent', 
    icon: LayoutDashboard,
    roles: ['agent']
  },
  { 
    name: 'My Assigned', 
    href: '/agent/assigned', 
    icon: InboxIcon,
    roles: ['agent']
  },
  { 
    name: 'Ticket Queue', 
    href: '/agent/queue', 
    icon: List,
    roles: ['agent']
  },
  { 
    name: 'Knowledge Base', 
    href: '/agent/kb/articles', 
    icon: FileText,
    roles: ['agent']
  },

  // Common Navigation
  { 
    name: 'Help', 
    href: '/kb', 
    icon: HelpCircle,
    roles: ['customer', 'agent', 'admin']
  },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { currentUser, logout } = useUserStore();
  const { toast } = useToast();

  if (!currentUser) return null;

  const userNavigation = navigation.filter(item => 
    item.roles.includes(currentUser.role as UserRole)
  );

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full border-r bg-gray-50/40">
      <ScrollArea className="flex-1 p-4">
        <nav className="flex flex-col gap-1">
          {userNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2",
                    location === item.href && "bg-gray-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}