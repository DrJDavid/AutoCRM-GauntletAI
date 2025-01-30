import { Link, useLocation } from 'react-router-dom';
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
  to: string;
  icon: React.ElementType;
  roles: UserRole[];
};

const navigation: NavigationItem[] = [
  // Customer Portal Navigation
  { 
    name: 'My Dashboard', 
    to: '/portal/dashboard', 
    icon: LayoutDashboard,
    roles: ['customer']
  },
  { 
    name: 'Submit Ticket', 
    to: '/portal/tickets/new', 
    icon: Plus,
    roles: ['customer']
  },
  { 
    name: 'My Tickets', 
    to: '/portal/tickets', 
    icon: Ticket,
    roles: ['customer']
  },
  { 
    name: 'Knowledge Base', 
    to: '/portal/kb', 
    icon: FileText,
    roles: ['customer']
  },

  // Admin Navigation
  { 
    name: 'Admin Dashboard', 
    to: '/admin/dashboard', 
    icon: LayoutDashboard,
    roles: ['admin']
  },
  { 
    name: 'Tickets', 
    to: '/admin/tickets', 
    icon: Ticket,
    roles: ['admin']
  },
  { 
    name: 'Manage Agents', 
    to: '/admin/agents', 
    icon: UserCog,
    roles: ['admin']
  },
  { 
    name: 'Users', 
    to: '/admin/users', 
    icon: Users,
    roles: ['admin']
  },
  { 
    name: 'Analytics', 
    to: '/admin/analytics', 
    icon: BarChart,
    roles: ['admin']
  },
  { 
    name: 'Settings', 
    to: '/admin/settings', 
    icon: Settings,
    roles: ['admin']
  },
  { 
    name: 'Invite Customers', 
    to: '/admin/invite-customers', 
    icon: UserPlus,
    roles: ['admin']
  },

  // Agent Navigation
  { 
    name: 'Agent Dashboard', 
    to: '/agent/dashboard', 
    icon: LayoutDashboard,
    roles: ['agent']
  },
  { 
    name: 'Ticket Queue', 
    to: '/agent/queue', 
    icon: InboxIcon,
    roles: ['agent']
  },
  { 
    name: 'Assigned Tickets', 
    to: '/agent/assigned', 
    icon: List,
    roles: ['agent']
  },
  { 
    name: 'All Tickets', 
    to: '/agent/tickets', 
    icon: Ticket,
    roles: ['agent']
  }
];

export function Sidebar() {
  const location = useLocation();
  const { currentUser } = useUserStore();
  const { toast } = useToast();

  const filteredNavigation = navigation.filter(item => 
    item.roles.some(role => {
      if (role === 'admin') {
        return currentUser?.role === 'admin' || currentUser?.role === 'head_admin';
      }
      return currentUser?.role === role;
    })
  );

  return (
    <div className="flex h-full w-full flex-col gap-4 border-r bg-background">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || 
                           location.pathname.startsWith(`${item.to}/`);

            return (
              <Link
                key={item.name}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}