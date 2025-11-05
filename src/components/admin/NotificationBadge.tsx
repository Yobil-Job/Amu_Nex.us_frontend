import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  showZero?: boolean;
}

const NotificationBadge = ({ count, className, showZero = false }: NotificationBadgeProps) => {
  if (!showZero && count === 0) {
    return null;
  }

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <Bell className="h-5 w-5 text-white" />
      {count > 0 && (
        <Badge
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs font-bold rounded-full border-2 border-background animate-pulse"
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </div>
  );
};

export default NotificationBadge;

