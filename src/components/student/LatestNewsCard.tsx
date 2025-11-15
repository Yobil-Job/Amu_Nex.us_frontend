import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Newspaper, Building2, Clock, ChevronRight, Sparkles, Image as ImageIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

interface LatestNewsCardProps {
  clubs?: Array<{
    id: number;
    title?: string;
    name?: string;
    club_Type?: string;
    logo?: string;
  }>;
  isLoading?: boolean;
  onViewAll?: () => void;
}

const LatestNewsCard = ({ clubs = [], isLoading, onViewAll }: LatestNewsCardProps) => {
  const navigate = useNavigate();

  // Get the latest news item (mock - will be replaced with actual news API later)
  const latestNews = useMemo(() => {
    if (!clubs || clubs.length === 0) return null;
    
    // Get the first club for the latest news
    const club = clubs[0];
    return {
      id: `news-${club.id}-latest`,
      title: `${club.title || club.name || 'Club'} Announces New Initiatives`,
      description: `Exciting updates and new opportunities are now available. Join us for upcoming events and activities that will enhance your experience.`,
      club: club,
      date: new Date().toISOString(),
      image: club.logo || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop', // Fallback image
    };
  }, [clubs]);

  const handleViewAll = () => {
      if (onViewAll) {
        onViewAll();
      }
  };

  const getTimeAgo = (dateString: string) => {
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
      return 'Recently';
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20 glow-effect">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestNews) {
    return (
      <Card className="glass-card border-primary/20 glow-effect">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-accent" />
            Latest News
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Stay updated with the latest from your clubs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Newspaper className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground mb-2">No news available yet</p>
            <p className="text-xs text-muted-foreground">
              News from your clubs will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 glow-effect hover:shadow-lg transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex-1">
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-accent" />
            Latest News
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Stay updated with the latest from your clubs
          </CardDescription>
        </div>
        <Badge className="bg-accent/20 text-accent border-accent/30">
          <Sparkles className="h-3 w-3 mr-1" />
          Latest
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* News Image */}
          <div className="relative group overflow-hidden rounded-lg border border-primary/20">
            {latestNews.image ? (
              <img
                src={latestNews.image}
                alt={latestNews.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop';
                }}
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground opacity-50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* News Content */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {latestNews.club && (
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-white">
                    {latestNews.club.title || latestNews.club.name || 'Unknown Club'}
                  </span>
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-white leading-tight">
                {latestNews.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {latestNews.description}
              </p>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{getTimeAgo(latestNews.date)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-primary/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 border-primary/20 hover:bg-primary/10"
                onClick={handleViewAll}
              >
                View All News
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LatestNewsCard;

