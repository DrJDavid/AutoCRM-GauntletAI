import { Link } from 'wouter';
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
  UserCog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
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

  // Agent Navigation
  { 
    name: 'Agent Dashboard', 
    href: '/agent/dashboard', 
    icon: LayoutDashboard,
    roles: ['agent']
  },
  { 
    name: 'Ticket Queue', 
    href: '/agent/tickets/queue', 
    icon: InboxIcon,
    roles: ['agent']
  },
  { 
    name: 'My Assigned', 
    href: '/agent/tickets/my-tickets', 
    icon: List,
    roles: ['agent']
  },
  { 
    name: 'Knowledge Base', 
    href: '/agent/kb/articles', 
    icon: FileText,
    roles: ['agent']
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
    name: 'Invite Customers', 
    href: '/org/customers/invite', 
    icon: UserPlus,
    roles: ['admin', 'agent']
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
    href: '/org/agents/invite',
    icon: UserCog,
    roles: ['admin'],
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
  const { currentUser } = useUserStore();

  if (!currentUser) return null;

  const userNavigation = navigation.filter(item => 
    item.roles.includes(currentUser.role)
  );

  return (
    <div className="flex flex-col h-full border-r bg-gray-50/40">
      <ScrollArea className="flex-1 p-4">
        <nav className="flex flex-col gap-1">
          {userNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
            >
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-2',
                  window.location.pathname === item.href && 'bg-gray-100'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}