import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Calendar, Users, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

interface ClubActivityDashboardProps {
  clubs: any[];
  events: any[];
  isLoading: boolean;
}

const ClubActivityDashboard = ({ clubs, events, isLoading }: ClubActivityDashboardProps) => {
  const activityData = useMemo(() => {
    if (!clubs || clubs.length === 0) return [];

    // Debug: Log first event structure if available
    if (import.meta.env.DEV && events.length > 0) {

      console.log('📊 ClubActivityDashboard - Event keys:', Object.keys(events[0]));
    }

    return clubs.slice(0, 10).map((club) => {
      // More robust event matching - check multiple possible fields
      const clubEvents = events.filter((event) => {
        // Check all possible ways the club ID might be stored
        const eventClubId = 
          event.club?.id || 
          event.clubId || 
          event.club_id ||
          event.club?.clubId ||
          event.club?.club_id ||
          (event.club && typeof event.club === 'object' ? Object.values(event.club).find(v => typeof v === 'number') : null);
        
        const clubId = club.id;
        
        // Handle both string and number comparisons
        return eventClubId != null && clubId != null && 
               (String(eventClubId) === String(clubId) || 
                Number(eventClubId) === Number(clubId));
      });
      
      const upcomingEvents = clubEvents.filter((event) => {
        if (!event.startAt && !event.startDate && !event.date) return false;
        try {
          const eventDate = new Date(event.startAt || event.startDate || event.date);
          return eventDate > new Date();
        } catch {
          return false;
        }
      });

      return {
        name: (club.title || club.name || `Club ${club.id}`).substring(0, 15),
        totalEvents: clubEvents.length,
        upcomingEvents: upcomingEvents.length,
        pastEvents: clubEvents.length - upcomingEvents.length,
      };
    });
  }, [clubs, events]);

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20">
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
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Club Activity Dashboard
        </CardTitle>
        <CardDescription>Events distribution across top clubs</CardDescription>
      </CardHeader>
      <CardContent>
        {activityData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No activity data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.5)"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="upcomingEvents" fill="#f8b500" name="Upcoming Events" />
              <Bar dataKey="pastEvents" fill="#6a4c93" name="Past Events" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubActivityDashboard;

