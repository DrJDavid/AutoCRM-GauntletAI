import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed';
  className?: string;
};

const statusConfig = {
  new: { color: 'bg-blue-100 text-blue-800', label: 'New' },
  open: { color: 'bg-green-100 text-green-800', label: 'Open' },
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
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
