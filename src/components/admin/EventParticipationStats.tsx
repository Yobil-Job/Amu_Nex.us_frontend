import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

interface EventParticipationStatsProps {
  events: any[];
  isLoading: boolean;
}

const EventParticipationStats = ({ events, isLoading }: EventParticipationStatsProps) => {
  const stats = useMemo(() => {
    const now = new Date();
    const upcomingEvents = events.filter((event) => {
      const startDateStr = event.startAt || event.startDate || event.date;
      if (!startDateStr) return false;
      try {
        return new Date(startDateStr) > now;
      } catch {
        return false;
      }
    });

    const pastEvents = events.filter((event) => {
      const startDateStr = event.startAt || event.startDate || event.date;
      if (!startDateStr) return false;
      try {
        return new Date(startDateStr) <= now;
      } catch {
        return false;
      }
    });

    // Calculate total participation (if available in event data)
    // Note: This is a placeholder - actual participation count would come from backend
    const totalParticipation = events.reduce((sum, event) => {
      return sum + (event.participantCount || event.participationCount || 0);
    }, 0);

    const avgParticipation = events.length > 0 ? Math.round(totalParticipation / events.length) : 0;

    return {
      total: events.length,
      upcoming: upcomingEvents.length,
      past: pastEvents.length,
      totalParticipation,
      avgParticipation,
    };
  }, [events]);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="glass-card border-primary/20">
            <CardContent className="p-4">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Events</div>
        </CardContent>
      </Card>

      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-warning">{stats.upcoming}</div>
          <div className="text-sm text-muted-foreground">Upcoming</div>
        </CardContent>
      </Card>

      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-muted-foreground">{stats.past}</div>
          <div className="text-sm text-muted-foreground">Past</div>
        </CardContent>
      </Card>

      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div className="text-2xl font-bold text-white">{stats.totalParticipation}</div>
          </div>
          <div className="text-sm text-muted-foreground">Total Participation</div>
        </CardContent>
      </Card>

      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <div className="text-2xl font-bold text-white">{stats.avgParticipation}</div>
          </div>
          <div className="text-sm text-muted-foreground">Avg per Event</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventParticipationStats;

