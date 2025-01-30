import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export function AuthHeader() {
  return (
    <div className="flex justify-between items-center py-4">
      <Link to="/" className={cn('flex items-center text-lg font-medium')}>
        <Button variant="ghost" size="icon" className="hover:bg-transparent">
          <Home className="h-6 w-6" />
        </Button>
      </Link>
      <div className="text-2xl font-bold">AutoCRM</div>
      <div className="w-10" /> {/* Spacer to center the logo */}
    </div>
  );
} 