import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  className?: string;
}

const statusConfig = {
  open: { color: 'bg-green-100 text-green-800', label: 'Open' },
  in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
  resolved: { color: 'bg-purple-100 text-purple-800', label: 'Resolved' },
  closed: { color: 'bg-gray-100 text-gray-800', label: 'Closed' }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="secondary"
      className={cn(config.color, 'font-medium', className)}
    >
      {config.label}
    </Badge>
  );
}
