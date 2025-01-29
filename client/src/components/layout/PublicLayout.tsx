import { FC } from 'react';
import { cn } from '@/lib/utils';

interface PublicLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PublicLayout: FC<PublicLayoutProps> = ({ children, className }) => {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}; 