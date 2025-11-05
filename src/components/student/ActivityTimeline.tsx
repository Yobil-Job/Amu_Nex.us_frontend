import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Building2, Calendar, Bell, Shield, UserPlus, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityItem {
  id: string;
  type: 'club_joined' | 'event_attended' | 'announcement_read' | 'role_assigned' | 'profile_updated';
  title: string;
  description: string;
  timestamp: string;
}

interface ActivityTimelineProps {
  userId?: number;
  isLoading?: boolean;
}

const STORAGE_KEY = 'student_activity_timeline';

const ActivityTimeline = ({ userId, isLoading }: ActivityTimelineProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (userId) {
      loadActivities();
    }
  }, [userId]);

  const loadActivities = () => {
    if (!userId) return;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (stored) {
        const activitiesList: any[] = JSON.parse(stored);
        // Clean up activities - remove icon/color if present and ensure valid structure
        // Also replace any old "Guildmate Nexus" references with "AMU NEX.US"
        const cleanedActivities: ActivityItem[] = activitiesList
          .filter((a) => a && a.id && a.type && a.title && a.timestamp)
          .map(({ id, type, title, description, timestamp }) => ({
            id,
            type,
            title: (title || '').replace(/Guildmate Nexus/gi, 'AMU NEX.US'),
            description: (description || '').replace(/Guildmate Nexus/gi, 'AMU NEX.US'),
            timestamp,
          }))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);
        setActivities(cleanedActivities);
        // Save cleaned version back (always save to replace old names)
        saveActivities(cleanedActivities);
      } else {
        // Initialize with some default activities
        const defaultActivities: ActivityItem[] = [
          {
            id: '1',
            type: 'profile_updated',
            title: 'Welcome to AMU NEX.US!',
            description: 'Your account has been created successfully',
            timestamp: new Date().toISOString(),
          },
        ];
        setActivities(defaultActivities);
        saveActivities(defaultActivities);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
      // If loading fails, initialize with default
      const defaultActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'profile_updated',
          title: 'Welcome to AMU NEX.US!',
          description: 'Your account has been created successfully',
          timestamp: new Date().toISOString(),
        },
      ];
      setActivities(defaultActivities);
    }
  };

  const saveActivities = (activitiesList: ActivityItem[]) => {
    if (!userId) return;
    try {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(activitiesList));
    } catch (error) {
      console.error('Failed to save activities:', error);
    }
  };

  // Listen for custom events from other components to add activities
  useEffect(() => {
    const handleActivityEvent = (event: CustomEvent) => {
      const { type, title, description } = event.detail;
      const newActivity: ActivityItem = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        title,
        description,
        timestamp: new Date().toISOString(),
      };
      const updated = [newActivity, ...activities].slice(0, 50); // Keep last 50
      setActivities(updated);
      saveActivities(updated);
    };

    window.addEventListener('studentActivity' as any, handleActivityEvent as EventListener);
    return () => {
      window.removeEventListener('studentActivity' as any, handleActivityEvent as EventListener);
    };
  }, [activities]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'club_joined':
        return <Building2 className="h-4 w-4" />;
      case 'event_attended':
        return <Calendar className="h-4 w-4" />;
      case 'announcement_read':
        return <Bell className="h-4 w-4" />;
      case 'role_assigned':
        return <Shield className="h-4 w-4" />;
      case 'profile_updated':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'club_joined':
        return 'text-primary';
      case 'event_attended':
        return 'text-success';
      case 'announcement_read':
        return 'text-accent';
      case 'role_assigned':
        return 'text-info';
      case 'profile_updated':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getActivityBadgeColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'club_joined':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'event_attended':
        return 'bg-success/20 text-success border-success/30';
      case 'announcement_read':
        return 'bg-accent/20 text-accent border-accent/30';
      case 'role_assigned':
        return 'bg-info/20 text-info border-info/30';
      case 'profile_updated':
        return 'bg-muted/20 text-muted-foreground border-muted/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getTimeAgo = (timestamp: string) => {
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
      return 'Unknown';
    }
  };

  const getActivityTypeLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'club_joined':
        return 'Club Joined';
      case 'event_attended':
        return 'Event';
      case 'announcement_read':
        return 'Announcement';
      case 'role_assigned':
        return 'Role';
      case 'profile_updated':
        return 'Profile';
      default:
        return 'Activity';
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20 glow-effect h-full">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
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
            <Activity className="h-5 w-5 text-warning" />
            Activity Timeline
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Your recent activity and interactions
          </CardDescription>
        </div>
        <div className="p-3 rounded-xl bg-warning/10 shadow-sm animate-float">
          <Activity className="h-6 w-6 text-warning" />
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your activities will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="relative flex gap-3 pb-4 last:pb-0"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Timeline line */}
                {index < activities.length - 1 && (
                  <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-primary/20"></div>
                )}
                
                {/* Icon */}
                <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getActivityBadgeColor(activity.type)}>
                          {getActivityTypeLabel(activity.type)}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-semibold text-white">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{getTimeAgo(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Export helper function to add activities from other components
export const addActivity = (type: ActivityItem['type'], title: string, description: string) => {
  const event = new CustomEvent('studentActivity', {
    detail: { type, title, description },
  });
  window.dispatchEvent(event);
};

export default ActivityTimeline;

