import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Clock, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AnnouncementCardProps {
  announcement: {
    id: number;
    title?: string;
    description?: string;
    createdAt?: string;
    club?: {
      id: number;
      title?: string;
      name?: string;
    };
  };
  isRead?: boolean;
  onViewDetails?: (announcement: any) => void;
  onMarkAsRead?: (announcementId: number) => void;
}

const AnnouncementCard = ({
  announcement,
  isRead = false,
  onViewDetails,
  onMarkAsRead,
}: AnnouncementCardProps) => {
  const getTimeAgo = (announcement: any) => {
    // Try multiple date fields
    const dateStr = announcement.createdAt || announcement.created_at || announcement.scheduledAt || announcement.scheduled_at || announcement.date || announcement.postedAt;
    if (!dateStr) return 'Unknown date';
    try {
      let date: Date;
      // Try parseISO first (for ISO strings)
      if (typeof dateStr === 'string') {
        try {
          date = parseISO(dateStr);
          if (isNaN(date.getTime())) {
            date = new Date(dateStr);
          }
        } catch {
          date = new Date(dateStr);
        }
      } else {
        date = new Date(dateStr);
      }
      
      if (isNaN(date.getTime())) return 'Unknown date';
      
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
    <Card
      className={`border-primary/20 hover:shadow-lg transition-all cursor-pointer ${
        !isRead ? 'border-l-4 border-l-primary bg-primary/5' : 'border-l-4 border-l-muted-foreground/30'
      }`}
      onClick={() => onViewDetails?.(announcement)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {!isRead && (
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
              )}
              <CardTitle className={`text-lg ${!isRead ? 'font-semibold' : 'font-normal'}`}>
                {announcement.title || 'Untitled Announcement'}
              </CardTitle>
            </div>
            {announcement.club && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {announcement.club.title || announcement.club.name || 'Unknown Club'}
                </span>
              </div>
            )}
          </div>
          {!isRead && (
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 flex-shrink-0">
              New
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {announcement.description && (
          <p className={`text-sm line-clamp-3 ${!isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
            {announcement.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{getTimeAgo(announcement)}</span>
          </div>
          {!isRead && onMarkAsRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(announcement.id);
              }}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark as read
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnouncementCard;
