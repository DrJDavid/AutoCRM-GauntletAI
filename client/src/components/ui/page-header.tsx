import { FC } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export const PageHeader: FC<PageHeaderProps> = ({ 
  title, 
  description,
  className 
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-lg text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}; 