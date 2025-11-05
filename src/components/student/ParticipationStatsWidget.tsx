import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Bell, Building2, Award, Target, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ParticipationStatsWidgetProps {
  clubsCount: number;
  eventsCount: number;
  announcementsCount: number;
  rolesCount: number;
  isLoading?: boolean;
}

const ParticipationStatsWidget = ({
  clubsCount,
  eventsCount,
  announcementsCount,
  rolesCount,
  isLoading,
}: ParticipationStatsWidgetProps) => {
  const totalEngagement = useMemo(() => {
    return clubsCount + eventsCount + announcementsCount + rolesCount;
  }, [clubsCount, eventsCount, announcementsCount, rolesCount]);

  const engagementScore = useMemo(() => {
    // Calculate engagement score (0-100)
    const maxScore = 20; // Max expected in each category
    const clubsScore = Math.min((clubsCount / maxScore) * 25, 25);
    const eventsScore = Math.min((eventsCount / maxScore) * 25, 25);
    const announcementsScore = Math.min((announcementsCount / maxScore) * 25, 25);
    const rolesScore = Math.min((rolesCount / maxScore) * 25, 25);
    return Math.round(clubsScore + eventsScore + announcementsScore + rolesScore);
  }, [clubsCount, eventsCount, announcementsCount, rolesCount]);

  const getEngagementLevel = (score: number) => {
    if (score >= 75) return { label: 'Excellent', color: 'text-success', bg: 'bg-success/20', border: 'border-success/30' };
    if (score >= 50) return { label: 'Good', color: 'text-primary', bg: 'bg-primary/20', border: 'border-primary/30' };
    if (score >= 25) return { label: 'Moderate', color: 'text-accent', bg: 'bg-accent/20', border: 'border-accent/30' };
    return { label: 'Getting Started', color: 'text-muted-foreground', bg: 'bg-muted/20', border: 'border-muted/30' };
  };

  const engagementLevel = getEngagementLevel(engagementScore);

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

  const stats = [
    {
      label: 'Clubs',
      value: clubsCount,
      icon: Building2,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Events',
      value: eventsCount,
      icon: Calendar,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: 'Announcements',
      value: announcementsCount,
      icon: Bell,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Roles',
      value: rolesCount,
      icon: Award,
      color: 'text-info',
      bg: 'bg-info/10',
    },
  ];

  return (
    <Card className="glass-card border-primary/20 glow-effect h-full hover:shadow-lg transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-warning" />
            Participation Stats
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Your engagement across the platform
          </CardDescription>
        </div>
        <div className="p-3 rounded-xl bg-warning/10 shadow-sm animate-float">
          <BarChart3 className="h-6 w-6 text-warning" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Engagement Score */}
        <div className="glass-card p-4 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-white">Engagement Score</span>
            </div>
            <Badge className={`${engagementLevel.bg} ${engagementLevel.color} ${engagementLevel.border}`}>
              {engagementLevel.label}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold neon-text text-white">{engagementScore}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  engagementScore >= 75
                    ? 'bg-success'
                    : engagementScore >= 50
                    ? 'bg-primary'
                    : engagementScore >= 25
                    ? 'bg-accent'
                    : 'bg-muted-foreground'
                }`}
                style={{ width: `${engagementScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass-card p-3 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Total Engagement */}
        <div className="pt-3 border-t border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">Total Activities</span>
            <Badge variant="secondary" className="text-sm">
              {totalEngagement}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParticipationStatsWidget;

