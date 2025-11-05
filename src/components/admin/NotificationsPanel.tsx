import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, Circle, CheckCheck, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Notification } from './NotificationCenter';

interface NotificationsPanelProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: Notification) => void;
  onRefresh?: () => void;
}

const NotificationsPanel = ({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  onRefresh,
}: NotificationsPanelProps) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (filterType !== 'all') {
      filtered = filtered.filter((n) => n.type === filterType);
    }

    if (filterRead !== 'all') {
      filtered = filtered.filter((n) => (filterRead === 'unread' ? !n.read : n.read));
    }

    return filtered.sort((a, b) => {
      // Sort by unread first, then by timestamp
      if (a.read !== b.read) {
        return a.read ? 1 : -1;
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [notifications, filterType, filterRead]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'club_request':
        return '🏛️';
      case 'join_request':
        return '👤';
      case 'new_event':
        return '📅';
      case 'suspicious_activity':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'club_request':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'join_request':
        return 'bg-info/10 text-info border-info/30';
      case 'new_event':
        return 'bg-success/10 text-success border-success/30';
      case 'suspicious_activity':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/30';
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      return timestamp;
    }
  };

  const getTypeCount = (type: Notification['type']) => {
    return notifications.filter((n) => n.type === type).length;
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {unreadCount} unread
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Manage and view all system notifications
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onMarkAllAsRead}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </Button>
            )}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="club_request">
                  Club Requests ({getTypeCount('club_request')})
                </SelectItem>
                <SelectItem value="join_request">
                  Join Requests ({getTypeCount('join_request')})
                </SelectItem>
                <SelectItem value="new_event">
                  New Events ({getTypeCount('new_event')})
                </SelectItem>
                <SelectItem value="suspicious_activity">
                  Suspicious Activity ({getTypeCount('suspicious_activity')})
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRead} onValueChange={setFilterRead}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No notifications found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'glass-card p-4 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all cursor-pointer',
                    !notification.read && 'bg-primary/5 border-primary/40'
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
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <Badge className={cn('text-xs mb-1', getNotificationColor(notification.type))}>
                            {notification.type === 'club_request' && 'Club Request'}
                            {notification.type === 'join_request' && 'Join Request'}
                            {notification.type === 'new_event' && 'New Event'}
                            {notification.type === 'suspicious_activity' && 'Suspicious Activity'}
                          </Badge>
                          <h4 className="text-sm font-semibold text-white leading-tight mb-1">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notification.id);
                              }}
                              title="Mark as read"
                            >
                              <Circle className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          {notification.read && (
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </span>
                        {notification.link && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (notification.link) {
                                window.location.href = notification.link;
                              }
                            }}
                          >
                            View →
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsPanel;

