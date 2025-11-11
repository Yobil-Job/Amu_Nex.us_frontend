import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, TrendingUp, ArrowRight, Plus, Award, Star, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

interface Club {
  id: number;
  title?: string;
  name?: string;
  club_Type?: string;
  description?: string;
  logo?: string;
}

interface ClubsJoinedWidgetProps {
  clubsCount: number;
  clubs?: Club[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

const ClubsJoinedWidget = ({ clubsCount, clubs = [], isLoading, onViewAll }: ClubsJoinedWidgetProps) => {
  const navigate = useNavigate();

  const clubTypesBreakdown = useMemo(() => {
    const types: Record<string, number> = {};
    clubs.forEach(club => {
      const type = club.club_Type || 'Other';
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([type, count]) => ({ type, count }));
  }, [clubs]);

  const displayedClubs = useMemo(() => clubs.slice(0, 3), [clubs]);

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/clubs');
    }
  };

  const handleDiscoverClubs = () => {
    navigate('/clubs');
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20 glow-effect h-full">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 glow-effect h-full hover:shadow-lg transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Clubs Joined
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Your active club memberships
          </CardDescription>
        </div>
        <div className="p-3 rounded-xl bg-primary/10 shadow-sm animate-float">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-4xl font-bold neon-text text-white mb-1">
              {clubsCount}
            </div>
            <p className="text-sm text-muted-foreground">
              {clubsCount === 1 ? 'Club' : 'Clubs'} active
            </p>
          </div>
          <div className="flex items-center gap-1 text-success">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Active</span>
          </div>
        </div>

        {/* Club Types Breakdown */}
        {clubTypesBreakdown.length > 0 && (
          <div className="pt-4 border-t border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-white">By Category</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {clubTypesBreakdown.map(({ type, count }) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type} ({count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Club List Preview */}
        {displayedClubs.length > 0 && (
          <div className="pt-4 border-t border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-white">Your Clubs</span>
              </div>
              {clubsCount > 3 && (
                <span className="text-xs text-muted-foreground">+{clubsCount - 3} more</span>
              )}
            </div>
            <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
              {displayedClubs.map((club) => (
                <div
                  key={club.id}
                  className="glass-card p-2 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all cursor-pointer hover:scale-[1.01]"
                  onClick={handleViewAll}
                >
                  <div className="flex items-center gap-3">
                    {club.logo ? (
                      <img
                        src={club.logo}
                        alt={`${club.title || club.name} logo`}
                        className="w-10 h-10 rounded-full object-cover border-2 border-primary/30 shadow-md flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.nextElementSibling) {
                            (target.nextElementSibling as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center border-2 border-primary/30 shadow-md flex-shrink-0 ${club.logo ? 'hidden' : ''}`}
                    >
                      <Building2 className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white truncate">
                        {club.title || club.name || `Club ${club.id}`}
                      </div>
                      {club.club_Type && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {club.club_Type}
                        </Badge>
                      )}
                    </div>
                    <Award className="h-4 w-4 text-accent flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-primary/20 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Membership Status</span>
            <Badge className="bg-success/20 text-success border-success/30">
              <Users className="h-3 w-3 mr-1" />
              {clubsCount > 0 ? 'Active Member' : 'No Memberships'}
            </Badge>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-primary/20 hover:bg-primary/10"
              onClick={handleViewAll}
            >
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1 bg-gradient-primary"
              onClick={handleDiscoverClubs}
            >
              <Plus className="h-4 w-4 mr-2" />
              Discover
            </Button>
          </div>
        </div>

        {clubsCount === 0 && (
          <div className="pt-4 border-t border-primary/20">
            <p className="text-sm text-muted-foreground text-center py-2">
              Join clubs to connect with like-minded students!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubsJoinedWidget;

