import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Building2, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface Announcement {
  id: number;
  title?: string;
  description?: string;
  createdAt?: string;
  club?: {
    id: number;
    title?: string;
    name?: string;
  };
}

interface NotificationsPanelProps {
  announcements: Announcement[];
  unreadAnnouncements: number[];
  onMarkAsRead?: (announcementId: number) => void;
  onMarkAllAsRead?: () => void;
  onViewAnnouncement?: (announcement: Announcement) => void;
}

const NotificationsPanel = ({
  announcements,
  unreadAnnouncements,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewAnnouncement,
}: NotificationsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const unreadAnnouncementsList = announcements.filter(ann => 
    unreadAnnouncements.includes(ann.id)
  );

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = parseISO(dateString);
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
      return 'Unknown date';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadAnnouncements.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadAnnouncements.length > 9 ? '9+' : unreadAnnouncements.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </SheetTitle>
            {unreadAnnouncements.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {unreadAnnouncements.length} New
              </Badge>
            )}
          </div>
          <SheetDescription>
            Latest announcements from your clubs
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {unreadAnnouncements.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {unreadAnnouncements.length} unread announcement{unreadAnnouncements.length !== 1 ? 's' : ''}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onMarkAllAsRead?.();
                }}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all as read
              </Button>
            </div>
          )}

          {unreadAnnouncementsList.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground text-sm">
                  You have no new announcements.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {unreadAnnouncementsList.map((announcement) => (
                <Card
                  key={announcement.id}
                  className="border-primary/20 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    onViewAnnouncement?.(announcement);
                    setIsOpen(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0 animate-pulse" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                          {announcement.title || 'Untitled Announcement'}
                        </h4>
                        {announcement.club && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">
                              {announcement.club.title || announcement.club.name || 'Unknown Club'}
                            </span>
                          </div>
                        )}
                        {announcement.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {announcement.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{getTimeAgo(announcement.createdAt)}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkAsRead?.(announcement.id);
                            }}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark read
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationsPanel;
