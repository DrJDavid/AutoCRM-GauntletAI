import { Link } from 'wouter';
import { useUserStore } from '@/stores/userStore';
import {
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  HelpCircle,
  Plus,
  List
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
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    roles: ['admin']
  },
  { 
    name: 'All Tickets', 
    href: '/tickets', 
    icon: List,
    roles: ['agent', 'admin']
  },
  { 
    name: 'My Tickets', 
    href: '/customer-portal', 
    icon: Ticket,
    roles: ['customer']
  },
  { 
    name: 'New Ticket', 
    href: '/customer-portal?tab=new-ticket', 
    icon: Plus,
    roles: ['customer']
  },
  { 
    name: 'Customers', 
    href: '/customers', 
    icon: Users,
    roles: ['admin']
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings,
    roles: ['admin']
  },
  { 
    name: 'Help', 
    href: '/help', 
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