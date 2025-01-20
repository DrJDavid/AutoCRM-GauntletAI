import { Link } from 'wouter';
import { useUserStore } from '@/stores/userStore';
import {
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tickets', href: '/tickets', icon: Ticket },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

export function Sidebar() {
  const { currentUser } = useUserStore();
  const isAgent = currentUser?.role === 'agent';

  return (
    <div className="flex flex-col h-full border-r bg-gray-50/40">
      <ScrollArea className="flex-1 p-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => {
            if (!isAgent && ['customers', 'settings'].includes(item.href.slice(1))) {
              return null;
            }

            return (
              <Link
                key={item.name}
                href={item.href}
              >
                {({ isActive }) => (
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-2',
                      isActive && 'bg-gray-100'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
