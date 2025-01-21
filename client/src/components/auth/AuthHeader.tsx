import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export function AuthHeader() {
  return (
    <div className="absolute top-4 left-4">
      <Link href="/">
        <Button variant="ghost" size="icon" className="hover:bg-gray-100">
          <Home className="h-5 w-5" />
        </Button>
      </Link>
    </div>
  );
} 