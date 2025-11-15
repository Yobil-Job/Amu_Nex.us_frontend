import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { newsApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { Newspaper, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/admin/EmptyState';

const News = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<Record<number, number>>({});

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setIsLoading(true);
    try {
      const response = await newsApi.getAll();
      const newsList = extractCollection<any>(response) || [];
      setNews(newsList);
      const initialIndices: Record<number, number> = {};
      newsList.forEach((item: any) => {
        if (item.images && item.images.trim()) {
          initialIndices[item.id] = 0;
        }
      });
      setCurrentIndex(initialIndices);
    } catch (error: any) {
      console.error('Failed to load news:', error);
      toast.error('Failed to load news');
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

  const nextImage = (newsId: number, totalImages: number) => {
    setCurrentIndex(prev => ({
      ...prev,
      [newsId]: ((prev[newsId] || 0) + 1) % totalImages
    }));
  };

  const prevImage = (newsId: number, totalImages: number) => {
    setCurrentIndex(prev => ({
      ...prev,
      [newsId]: ((prev[newsId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in min-h-screen pb-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card border-primary/20">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Newspaper className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              News
            </h1>
            <p className="text-muted-foreground text-lg">
              Latest updates and announcements from the system
            </p>
          </div>
        </div>
      </div>

      <div className="luxury-divider"></div>

      {news.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No News Available"
          description="There are no news articles published yet."
        />
      ) : (
        <div className="space-y-8">
          {news.map((item) => {
            const images = getImagesList(item.images);
            const currentImgIndex = currentIndex[item.id] || 0;
            const hasMultipleImages = images.length > 1;

            return (
              <Card key={item.id} className="glass-card border-primary/20 overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-2xl text-white mb-2">{item.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {item.createdAt ? format(parseISO(item.createdAt), 'PPp') : 'Unknown date'}
                        </div>
                        {item.createdBy && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            System Admin
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {images.length > 0 && (
                    <div className="relative w-full rounded-lg overflow-hidden bg-muted">
                      <div className="relative aspect-video w-full">
                        {hasMultipleImages && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background/90"
                              onClick={() => prevImage(item.id, images.length)}
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background/90"
                              onClick={() => nextImage(item.id, images.length)}
                            >
                              <ChevronRight className="h-5 w-5" />
                            </Button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
                              {images.map((_, idx) => (
                                <div
                                  key={idx}
                                  className={`h-2 rounded-full transition-all ${
                                    idx === currentImgIndex
                                      ? 'w-6 bg-primary'
                                      : 'w-2 bg-primary/30'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                        <img
                          src={images[currentImgIndex]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450?text=Image+Not+Found';
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="prose prose-invert max-w-none">
                    <p className="text-white whitespace-pre-wrap leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default News;

