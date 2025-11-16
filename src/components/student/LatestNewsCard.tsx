import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Newspaper, Clock, ChevronRight, Sparkles, Image as ImageIcon, Calendar } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { newsApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { cn } from '@/lib/utils';

interface LatestNewsCardProps {
  isLoading?: boolean;
  onViewAll?: () => void;
}

const LatestNewsCard = ({ isLoading: parentLoading, onViewAll }: LatestNewsCardProps) => {
  const navigate = useNavigate();
  const [latestNews, setLatestNews] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLatestNews();
  }, []);

  const loadLatestNews = async () => {
    setIsLoading(true);
    try {
      const response = await newsApi.getAll();
      const newsList = extractCollection<any>(response) || [];
      if (newsList.length > 0) {
        setLatestNews(newsList[0]);
      }
    } catch (error) {
      console.error('Failed to load latest news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getImagesList = (images: string | null): string[] => {
    if (!images || images.trim().length === 0) {
      return [];
    }
    return images.split(',').map(img => img.trim()).filter(img => img.length > 0);
  };

  const getTimeAgo = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const getReadingTime = (text: string): number => {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const handleCardClick = () => {
    navigate('/news');
  };

  const handleViewAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/news');
    }
  };

  if (parentLoading || isLoading) {
    return (
      <Card className="glass-card border-primary/20 glow-effect">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full rounded-lg" />
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
      <Card className="glass-card border-primary/20 glow-effect hover:border-primary/40 transition-all cursor-pointer" onClick={handleCardClick}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
              <Newspaper className="h-6 w-6 text-accent" />
              Latest News
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Stay updated with the latest system announcements
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl"></div>
              <Newspaper className="h-16 w-16 mx-auto text-primary/40 relative z-10" />
            </div>
            <p className="text-base text-muted-foreground mb-2 font-medium">No news available yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Check back later for the latest updates
            </p>
            <Button
              variant="outline"
              size="sm"
              className="border-primary/20 hover:bg-primary/10"
              onClick={handleViewAll}
            >
              View News Page
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const images = getImagesList(latestNews.images);
  const mainImage = images.length > 0 ? images[0] : null;

  return (
    <Card 
      className="glass-card border-primary/20 glow-effect hover:border-primary/40 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer group"
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex-1">
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <Newspaper className="h-5 w-5 text-accent" />
            </div>
            Latest News
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Stay updated with the latest system announcements
          </CardDescription>
        </div>
        <Badge className="bg-accent/20 text-accent border-accent/30 animate-pulse">
          <Sparkles className="h-3 w-3 mr-1" />
          New
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative group/image overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10">
            {mainImage ? (
              <>
                <img
                  src={mainImage}
                  alt={latestNews.title}
                  className="w-full h-full min-h-[280px] object-cover transition-transform duration-500 group-hover/image:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Image+Not+Found';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300" />
                {images.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs font-medium">
                    +{images.length - 1} more
                  </div>
                )}
              </>
            ) : (
              <div className="w-full min-h-[280px] flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                <ImageIcon className="h-20 w-20 text-primary/30" />
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {latestNews.createdAt 
                      ? format(parseISO(latestNews.createdAt), 'MMM d, yyyy')
                      : 'Recently'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-medium">{getReadingTime(latestNews.description)} min read</span>
                </div>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2">
                {latestNews.title}
              </h3>
              
              <p className="text-sm md:text-base text-white/70 leading-relaxed line-clamp-4">
                {latestNews.description}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-primary/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 border-primary/20 hover:bg-primary/10 hover:border-primary/40 group/btn"
                onClick={handleViewAll}
              >
                <span>View All News</span>
                <ChevronRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="purple-gold-gradient text-white shadow-colored-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/news');
                }}
              >
                Read More
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LatestNewsCard;

