import { getStatusBadgeClasses, formatStatus, type StatusEntity } from '@/lib/status-colors';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  entity: StatusEntity;
  status: string;
  className?: string;
}

export function StatusBadge({ entity, status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-overline',
        getStatusBadgeClasses(entity, status),
        className
      )}
    >
      {formatStatus(status)}
    </span>
  );
}
