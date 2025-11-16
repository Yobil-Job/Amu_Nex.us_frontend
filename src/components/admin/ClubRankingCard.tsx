import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Users, Calendar, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ClubRankingCardProps {
  clubs: any[];
  events: any[];
  isLoading: boolean;
}

const ClubRankingCard = ({ clubs, events, isLoading }: ClubRankingCardProps) => {
  const calculateRanking = () => {
    if (!clubs || clubs.length === 0) return [];

    // Debug: Log first event structure if available
    if (import.meta.env.DEV && events.length > 0) {

      console.log('🔍 ClubRankingCard - Event keys:', Object.keys(events[0]));
    }

    const clubStats = clubs.map((club) => {
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
        
        // Debug for first club
        if (import.meta.env.DEV && club.id === clubs[0]?.id && events.length > 0) {
          console.log(`🔍 Matching club ${club.id} (${club.title || club.name}):`, {
            eventClubId,
            clubId,
            event: events[0],
            match: eventClubId != null && clubId != null && 
                   (String(eventClubId) === String(clubId) || 
                    Number(eventClubId) === Number(clubId))
          });
        }
        
        // Handle both string and number comparisons
        return eventClubId != null && clubId != null && 
               (String(eventClubId) === String(clubId) || 
                Number(eventClubId) === Number(clubId));
      });
      
      const eventCount = clubEvents.length;
      
      // Calculate activity score (events * 10 as base, can be enhanced)
      const activityScore = eventCount * 10;

      return {
        club,
        eventCount,
        activityScore,
      };
    });

    // Sort by score, then by event count, then by club name for consistency
    const sorted = clubStats.sort((a, b) => {
      if (b.activityScore !== a.activityScore) {
        return b.activityScore - a.activityScore;
      }
      if (b.eventCount !== a.eventCount) {
        return b.eventCount - a.eventCount;
      }
      const aName = (a.club.title || a.club.name || '').toLowerCase();
      const bName = (b.club.title || b.club.name || '').toLowerCase();
      return aName.localeCompare(bName);
    });

    const ranked = sorted
      .slice(0, 5)
      .map((stat, index) => ({ ...stat, rank: index + 1 }));

    // Debug: Log ranking results
    if (import.meta.env.DEV) {
      console.log('🏆 ClubRankingCard - Rankings calculated:', ranked.map(r => ({
        club: r.club.title || r.club.name,
        events: r.eventCount,
        score: r.activityScore
      })));

    }

    return ranked;
  };

  const rankings = calculateRanking();

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-br from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30';
      default:
        return 'bg-primary/5 border-primary/20';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <Trophy className={`h-5 w-5 ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-orange-500'}`} />;
    }
    return <TrendingUp className="h-5 w-5 text-muted-foreground" />;
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
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning" />
          Top Clubs Ranking
        </CardTitle>
        <CardDescription>Ranked by activity and events</CardDescription>
      </CardHeader>
      <CardContent>
        {rankings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No club rankings available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rankings.map((ranking) => (
              <div
                key={ranking.club.id}
                className={`glass-card p-3 rounded-lg border ${getRankColor(ranking.rank)} transition-all hover:scale-105`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      {getRankIcon(ranking.rank)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg text-white">#{ranking.rank}</span>
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-white truncate">
                        {ranking.club.title || ranking.club.name || `Club ${ranking.club.id}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{ranking.eventCount} events</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>Score: {ranking.activityScore}</span>
                      </div>
                    </div>
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

export default ClubRankingCard;

