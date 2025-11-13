import { Bell, CheckCircle2, Circle, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import NotificationBadge from './NotificationBadge';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  type: 'join_request' | 'upcoming_event' | 'announcement' | 'new_member';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  metadata?: any;
}

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: Notification) => void;
  isLoading?: boolean;
}

const NotificationCenter = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  isLoading = false,
}: NotificationCenterProps) => {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'join_request':
        return '👤';
      case 'upcoming_event':
        return '📅';
      case 'announcement':
        return '📢';
      case 'new_member':
        return '✨';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'join_request':
        return 'bg-info/10 text-info border-info/30';
      case 'upcoming_event':
        return 'bg-success/10 text-success border-success/30';
      case 'announcement':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'new_member':
        return 'bg-accent/10 text-accent border-accent/30';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/30';
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return format(date, 'MMM dd, yyyy');
    } catch {
      return timestamp;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <NotificationBadge count={unreadCount} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 glass-card border-primary/20 p-0">
        <div className="p-4 border-b border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <DropdownMenuLabel className="text-lg font-semibold text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {unreadCount}
                </Badge>
              )}
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  onMarkAllAsRead();
                }}
                className="text-xs h-7 text-white hover:text-white hover:bg-primary/20"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-primary/20">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-primary/10 transition-colors cursor-pointer',
                    !notification.read && 'bg-primary/5'
                  )}
                  onClick={() => {
                    if (!notification.read) {
                      onMarkAsRead(notification.id);
                    }
                    onNotificationClick(notification);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1">
                          <Badge className={cn('text-xs mb-1', getNotificationColor(notification.type))}>
                            {notification.type === 'join_request' && 'Join Request'}
                            {notification.type === 'upcoming_event' && 'Upcoming Event'}
                            {notification.type === 'announcement' && 'Announcement'}
                            {notification.type === 'new_member' && 'New Member'}
                          </Badge>
                          <h4 className="text-sm font-semibold text-white leading-tight">
                            {notification.title}
                          </h4>
                        </div>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 flex-shrink-0 text-white hover:text-white hover:bg-primary/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkAsRead(notification.id);
                            }}
                          >
                            <Circle className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </span>
                        {notification.read && (
                          <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter;

