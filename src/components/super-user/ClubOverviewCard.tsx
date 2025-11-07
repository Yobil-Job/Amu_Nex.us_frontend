import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calendar, Users, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ClubOverviewCardProps {
  club: any;
  recentEvents: any[];
  memberCount: number;
  pendingRequestsCount: number;
  isLoading: boolean;
}

const ClubOverviewCard = ({ 
  club, 
  recentEvents, 
  memberCount, 
  pendingRequestsCount,
  isLoading 
}: ClubOverviewCardProps) => {
  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20 glow-effect">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!club) {
    return (
      <Card className="glass-card border-primary/20 glow-effect">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No club information available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 glow-effect">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {club.logo ? (
                <img 
                  src={club.logo} 
                  alt={club.title || club.name} 
                  className="h-16 w-16 rounded-xl object-cover border-2 border-primary/30"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-2xl neon-text text-white mb-1">
                  {club.title || club.name || 'Club'}
                </CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {club.description || 'No description available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <div className="text-2xl font-bold text-white">{memberCount}</div>
              <div className="text-xs text-muted-foreground">Members</div>
            </div>
          </div>
          {pendingRequestsCount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <Clock className="h-5 w-5 text-accent" />
              <div>
                <div className="text-2xl font-bold text-white">{pendingRequestsCount}</div>
                <div className="text-xs text-muted-foreground">Pending Requests</div>
              </div>
            </div>
          )}
        </div>

        {recentEvents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Recent Events
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
              {recentEvents.slice(0, 3).map((event: any) => (
                <div
                  key={event.id}
                  className="p-2 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {event.title || 'Untitled Event'}
                      </p>
                      {event.startAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(event.startAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubOverviewCard;

