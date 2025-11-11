import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Building2, Award } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { clubApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';

interface TopClubsChartProps {
  clubs: any[];
  events: any[];
  isLoading?: boolean;
}

const COLORS = ['#f8b500', '#6a4c93', '#c06c84', '#ff6b6b', '#4ecdc4', '#95e1d3', '#f38181', '#aa96da'];

const TopClubsChart = ({ clubs, events, isLoading }: TopClubsChartProps) => {
  const [clubMemberCounts, setClubMemberCounts] = useState<Record<number, number>>({});
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Load member counts for all clubs (to calculate activity score)
  useEffect(() => {
    if (!clubs || clubs.length === 0) return;

    const loadMemberCounts = async () => {
      setIsLoadingMembers(true);
      try {
        const memberCounts: Record<number, number> = {};
        
        // Load member counts for all clubs in parallel
        const memberPromises = clubs.map(async (club: any) => {
          try {
            const membersRes = await clubApi.getMembers(club.id).catch(() => ({ _embedded: { studentResponseDtoList: [] } }));
            const members = extractCollection<any>(membersRes) || [];
            return { clubId: club.id, count: members.length };
          } catch {
            return { clubId: club.id, count: 0 };
          }
        });

        const results = await Promise.all(memberPromises);
        results.forEach((result) => {
          memberCounts[result.clubId] = result.count;
        });

        setClubMemberCounts(memberCounts);
      } catch (error) {
        console.error('Failed to load member counts:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadMemberCounts();
  }, [clubs]);

  const topClubsData = useMemo(() => {
    if (!clubs || clubs.length === 0) {
      // If no clubs, return empty but don't show "no data" if we're still loading
      return [];
    }

    // Calculate activity score for each club
    // Score = (event count * 2) + (member count * 0.5)
    // This gives more weight to events but also considers club size
    const clubScores: Record<number, { 
      name: string; 
      eventCount: number; 
      memberCount: number; 
      activityScore: number; 
      clubId: number 
    }> = {};
    
    // Initialize all clubs
    clubs.forEach((club) => {
      clubScores[club.id] = {
        name: club.title || club.name || `Club ${club.id}`,
        eventCount: 0,
        memberCount: clubMemberCounts[club.id] || 0,
        activityScore: 0,
        clubId: club.id,
      };
    });

    // Count events per club
    // Check multiple possible event-club association fields
    if (events && events.length > 0) {
      events.forEach((event) => {
        // Try multiple ways to get club ID from event
        const clubId = event.club?.id || event.clubId || event.club?.clubId || event.club_id;
        
        if (clubId && clubScores[clubId]) {
          clubScores[clubId].eventCount++;
        }
      });
    }

    // Calculate activity scores
    Object.values(clubScores).forEach((club) => {
      club.activityScore = (club.eventCount * 2) + (club.memberCount * 0.5);
    });

    // Sort by activity score and take top 8
    // Show clubs even if they have no events (they still have members)
    const sortedClubs = Object.values(clubScores)
      .filter((club) => club.memberCount > 0 || club.eventCount > 0) // At least members or events
      .sort((a, b) => {
        // First sort by activity score
        if (b.activityScore !== a.activityScore) {
          return b.activityScore - a.activityScore;
        }
        // Then by event count
        if (b.eventCount !== a.eventCount) {
          return b.eventCount - a.eventCount;
        }
        // Then by member count
        return b.memberCount - a.memberCount;
      })
      .slice(0, 8)
      .map((club, index) => ({
        ...club,
        value: club.eventCount > 0 ? club.eventCount : 1, // Show events or 1 for visibility
        memberCount: club.memberCount,
        color: COLORS[index % COLORS.length],
      }));

    // Return clubs even if some have 0 events (they still appear in chart)
    return sortedClubs;
  }, [clubs, events, clubMemberCounts]);

  if (isLoading || isLoadingMembers) {
    return (
      <Card className="glass-card border-primary/20 glow-effect">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 glow-effect">
      <CardHeader>
        <CardTitle className="text-xl neon-text text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" />
          Top Active Clubs
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Top clubs ranked by activity (events & members)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isLoading && !isLoadingMembers && topClubsData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No club activity data available</p>
              {clubs && clubs.length > 0 && (
                <p className="text-xs mt-2">Found {clubs.length} club(s), {events?.length || 0} event(s)</p>
              )}
            </div>
          </div>
        ) : topClubsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topClubsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#f8b500"
                dataKey="value"
              >
                {topClubsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(26, 11, 46, 0.95)',
                  border: '1px solid rgba(248, 181, 0, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number, name: string, props: any) => {
                  const entry = props.payload;
                  return [`${entry.name}: ${value} events, ${entry.memberCount || 0} members`, 'Events'];
                }}
              />
              <Legend 
                wrapperStyle={{ color: 'rgba(255, 255, 255, 0.7)' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default TopClubsChart;

