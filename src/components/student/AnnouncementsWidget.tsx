import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Building2, Clock, ChevronRight, Check, TrendingUp, Activity, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

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

interface AnnouncementsWidgetProps {
  announcements: Announcement[];
  isLoading?: boolean;
  readAnnouncements?: number[];
  onViewAll?: () => void;
  onMarkAsRead?: (id: number) => void;
}

const AnnouncementsWidget = ({
  announcements,
  isLoading,
  readAnnouncements = [],
  onViewAll,
  onMarkAsRead,
}: AnnouncementsWidgetProps) => {
  const navigate = useNavigate();

  const latestAnnouncements = useMemo(() => 
    announcements
      .sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        try {
          return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
        } catch {
          return 0;
        }
      })
      .slice(0, 5),
    [announcements]
  );

  const announcementsByClub = useMemo(() => {
    const clubMap: Record<string, number> = {};
    announcements.forEach(ann => {
      const clubName = ann.club?.title || ann.club?.name || 'Unknown';
      clubMap[clubName] = (clubMap[clubName] || 0) + 1;
    });
    return Object.entries(clubMap).map(([club, count]) => ({ club, count }));
  }, [announcements]);

  const recentCount = useMemo(() => {
    const now = new Date();
    return announcements.filter(ann => {
      if (!ann.createdAt) return false;
      try {
        const date = parseISO(ann.createdAt);
        const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
        return diffDays <= 7;
      } catch {
        return false;
      }
    }).length;
  }, [announcements]);

  const unreadCount = latestAnnouncements.filter(
    ann => !readAnnouncements.includes(ann.id)
  ).length;

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

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/announcements');
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20 glow-effect h-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-56 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 glow-effect h-full hover:shadow-lg transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent" />
            Latest Announcements
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            {announcements.length} {announcements.length === 1 ? 'announcement' : 'announcements'} total
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-primary/20 text-primary border-primary/30">
                {unreadCount} new
              </Badge>
            )}
            {recentCount > 0 && (
              <span className="ml-2 text-success">• {recentCount} this week</span>
            )}
          </CardDescription>
        </div>
        <div className="p-3 rounded-xl bg-accent/10 shadow-sm animate-float">
          <Bell className="h-6 w-6 text-accent" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Announcements Statistics */}
        {announcements.length > 0 && announcementsByClub.length > 0 && (
          <div className="glass-card p-3 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold text-white">By Club</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {announcementsByClub.slice(0, 3).map(({ club, count }) => (
                <Badge key={club} variant="outline" className="text-xs">
                  {club} ({count})
                </Badge>
              ))}
              {announcementsByClub.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{announcementsByClub.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {latestAnnouncements.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No announcements yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
            {latestAnnouncements.map((announcement) => {
              const isRead = readAnnouncements.includes(announcement.id);
              return (
                <div
                  key={announcement.id}
                  className={`glass-card p-3 rounded-lg border transition-all cursor-pointer hover:scale-[1.01] ${
                    !isRead
                      ? 'border-l-4 border-l-primary bg-primary/5'
                      : 'border-primary/20 hover:bg-primary/10'
                  }`}
                  onClick={() => navigate('/announcements')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0"></div>
                        )}
                        <div className={`text-sm font-semibold truncate ${!isRead ? 'text-white' : 'text-muted-foreground'}`}>
                          {announcement.title || 'Untitled Announcement'}
                        </div>
                      </div>
                      {announcement.club && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {announcement.club.title || announcement.club.name || 'Unknown Club'}
                          </span>
                        </div>
                      )}
                      {announcement.description && (
                        <p className={`text-xs line-clamp-2 mb-1 ${!isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {announcement.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span>{getTimeAgo(announcement.createdAt)}</span>
                        </div>
                        {announcement.createdAt && (() => {
                          try {
                            const date = parseISO(announcement.createdAt);
                            const now = new Date();
                            const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
                            if (diffDays <= 1) {
                              return (
                                <Badge variant="outline" className="text-xs bg-success/20 text-success border-success/30">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Recent
                                </Badge>
                              );
                            }
                            return null;
                          } catch {
                            return null;
                          }
                        })()}
                      </div>
                    </div>
                    {!isRead && onMarkAsRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(announcement.id);
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {latestAnnouncements.length > 0 && (
          <div className="pt-3 border-t border-primary/20">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-primary/20 hover:bg-primary/10"
              onClick={handleViewAll}
            >
              View All Announcements
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnnouncementsWidget;

