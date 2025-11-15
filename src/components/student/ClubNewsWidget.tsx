import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Newspaper, Building2, Clock, ChevronRight, TrendingUp, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

interface ClubNewsWidgetProps {
  clubs?: Array<{
    id: number;
    title?: string;
    name?: string;
    club_Type?: string;
  }>;
  isLoading?: boolean;
  onViewAll?: () => void;
}

const ClubNewsWidget = ({ clubs = [], isLoading, onViewAll }: ClubNewsWidgetProps) => {
  const navigate = useNavigate();

  // Mock news items - will be replaced with actual news API later
  const mockNews = useMemo(() => {
    if (!clubs || clubs.length === 0) return [];
    
    // Generate mock news based on clubs
    return clubs.slice(0, 3).map((club, index) => ({
      id: `news-${club.id}-${index}`,
      title: `${club.title || club.name || 'Club'} Updates`,
      description: `Latest news and updates from ${club.title || club.name || 'the club'}`,
      club: club,
      date: new Date(Date.now() - index * 86400000).toISOString(), // Last 3 days
      isNew: index === 0,
    }));
  }, [clubs]);

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    }
  };

  const handleNewsClick = (newsId: string) => {
    console.log('News clicked:', newsId);
    // Navigate to news detail page (will be implemented later)
    // navigate('/news', { state: { newsId } });
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
      <Card className="glass-card border-primary/20 glow-effect h-full">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 glow-effect h-full hover:shadow-lg transition-all" style={{ pointerEvents: 'auto' }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-accent" />
            Club News
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Latest updates and news from your clubs
          </CardDescription>
        </div>
        <div className="p-3 rounded-xl bg-accent/10 shadow-sm animate-float">
          <Newspaper className="h-6 w-6 text-accent" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4" style={{ pointerEvents: 'auto' }}>
        {mockNews.length === 0 ? (
          <div className="text-center py-8">
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-2">No news available yet</p>
            <p className="text-xs text-muted-foreground">
              News from your clubs will appear here
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent" style={{ pointerEvents: 'auto' }}>
              {mockNews.map((news) => (
                <div
                  key={news.id}
                  className="glass-card p-3 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('News clicked:', news.id);
                    handleNewsClick(news.id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNewsClick(news.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {news.isNew && (
                          <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            New
                          </Badge>
                        )}
                        <div className="font-semibold text-sm text-white truncate">
                          {news.title}
                        </div>
                      </div>
                      {news.club && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {news.club.title || news.club.name || 'Unknown Club'}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {news.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span>{getTimeAgo(news.date)}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-white">
                    {mockNews.length} News Items
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-primary/20 hover:bg-primary/10"
                style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10, cursor: 'pointer' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('View All News button clicked');
                  handleViewAll();
                }}
              >
                View All News
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubNewsWidget;

