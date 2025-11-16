import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { newsApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { Newspaper, Calendar, User, ChevronLeft, ChevronRight, Image as ImageIcon, X, Maximize2, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/admin/EmptyState';
import { cn } from '@/lib/utils';

const News = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<Record<number, number>>({});
  const [lightboxOpen, setLightboxOpen] = useState<{ newsId: number; imageIndex: number } | null>(null);
  const [autoPlay, setAutoPlay] = useState<Record<number, boolean>>({});
  const [expandedNews, setExpandedNews] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadNews();
  }, []);

  useEffect(() => {
    const intervals: Record<number, NodeJS.Timeout> = {};
    
    Object.keys(autoPlay).forEach((newsIdStr) => {
      const newsId = Number(newsIdStr);
      if (autoPlay[newsId]) {
        const item = news.find(n => n.id === newsId);
        if (item) {
          const images = getImagesList(item.images);
          if (images.length > 1) {
            intervals[newsId] = setInterval(() => {
              setCurrentIndex(prev => ({
                ...prev,
                [newsId]: ((prev[newsId] || 0) + 1) % images.length
              }));
            }, 5000);
          }
        }
      }
    });

    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [autoPlay, news]);

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
      setExpandedNews(prev => {
        const newSet = new Set<number>();
        prev.forEach(id => {
          if (newsList.some((n: any) => n.id === id)) {
            newSet.add(id);
          }
        });
        return newSet;
      });
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

  const getReadingTime = (text: string): number => {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const nextImage = (newsId: number, totalImages: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex(prev => ({
      ...prev,
      [newsId]: ((prev[newsId] || 0) + 1) % totalImages
    }));
    setAutoPlay(prev => ({ ...prev, [newsId]: false }));
  };

  const prevImage = (newsId: number, totalImages: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex(prev => ({
      ...prev,
      [newsId]: ((prev[newsId] || 0) - 1 + totalImages) % totalImages
    }));
    setAutoPlay(prev => ({ ...prev, [newsId]: false }));
  };

  const openLightbox = (newsId: number, imageIndex: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLightboxOpen({ newsId, imageIndex });
  };

  const toggleExpand = (newsId: number) => {
    setExpandedNews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(newsId)) {
        newSet.delete(newsId);
      } else {
        newSet.add(newsId);
      }
      return newSet;
    });
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
        <Skeleton className="h-[600px] w-full rounded-lg" />
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="glass-card border-primary/20">
              <Skeleton className="h-64 w-full" />
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in min-h-screen pb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
              <Newspaper className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight neon-text text-white">
                News
              </h1>
              <p className="text-muted-foreground text-lg">
                Latest updates and announcements
              </p>
            </div>
          </div>
        </div>
        <div className="luxury-divider"></div>
        <EmptyState
          icon={Newspaper}
          title="No News Available"
          description="There are no news articles published yet."
        />
      </div>
    );
  }

  const featuredNews = news[0];
  const otherNews = news.slice(1);

  const featuredImages = getImagesList(featuredNews?.images);
  const featuredCurrentIndex = currentIndex[featuredNews?.id] || 0;

  return (
    <div className="space-y-12 animate-fade-in min-h-screen pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-5xl font-bold tracking-tight neon-text text-white mb-2">
            News
          </h1>
          <p className="text-muted-foreground text-lg">
            Stay informed with the latest updates
          </p>
        </div>
      </div>

      {featuredNews && (
        <article className="group relative">
          <Card className="glass-card border-primary/20 overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500">
            {featuredImages.length > 0 ? (
              <div className="relative w-full h-[550px] md:h-[650px] overflow-hidden">
                <div className="relative w-full h-full">
                  {featuredImages.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 bg-black/60 hover:bg-black/80 text-white backdrop-blur-md h-12 w-12 rounded-full shadow-lg"
                        onClick={(e) => prevImage(featuredNews.id, featuredImages.length, e)}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 bg-black/60 hover:bg-black/80 text-white backdrop-blur-md h-12 w-12 rounded-full shadow-lg"
                        onClick={(e) => nextImage(featuredNews.id, featuredImages.length, e)}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                        {featuredImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setCurrentIndex(prev => ({ ...prev, [featuredNews.id]: idx }));
                              setAutoPlay(prev => ({ ...prev, [featuredNews.id]: false }));
                            }}
                            className={cn(
                              "h-2 rounded-full transition-all duration-300 hover:scale-125",
                              idx === featuredCurrentIndex
                                ? "w-10 bg-white shadow-lg"
                                : "w-2 bg-white/60 hover:bg-white/80"
                            )}
                          />
                        ))}
                      </div>
                      <div className="absolute top-6 right-6 z-30 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg">
                        {featuredCurrentIndex + 1} / {featuredImages.length}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-6 left-6 z-30 bg-black/60 hover:bg-black/80 text-white backdrop-blur-md h-10 w-10 rounded-lg shadow-lg"
                        onClick={(e) => openLightbox(featuredNews.id, featuredCurrentIndex, e)}
                      >
                        <Maximize2 className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                  <img
                    src={featuredImages[featuredCurrentIndex]}
                    alt={featuredNews.title}
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x650?text=Image+Not+Found';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>
                
                {featuredImages.length > 1 && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/40 backdrop-blur-sm">
                    <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent px-2">
                      {featuredImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentIndex(prev => ({ ...prev, [featuredNews.id]: idx }));
                            setAutoPlay(prev => ({ ...prev, [featuredNews.id]: false }));
                          }}
                          className={cn(
                            "relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300",
                            idx === featuredCurrentIndex
                              ? "border-white scale-110 shadow-lg"
                              : "border-white/30 hover:border-white/60 opacity-70 hover:opacity-100"
                          )}
                        >
                          <img
                            src={img}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white z-20">
                  <div className="flex items-center gap-4 text-sm mb-4 opacity-95">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">
                        {featuredNews.createdAt 
                          ? format(parseISO(featuredNews.createdAt), 'MMMM d, yyyy')
                          : 'Unknown date'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <User className="h-4 w-4" />
                      <span className="font-medium">System Admin</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <span className="font-medium">{getReadingTime(featuredNews.description)} min read</span>
                    </div>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-bold mb-4 leading-tight drop-shadow-2xl max-w-4xl">
                    {featuredNews.title}
                  </h2>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-[400px] bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 flex items-center justify-center">
                <ImageIcon className="h-24 w-24 text-primary/30" />
              </div>
            )}
            
            <CardContent className="p-8 md:p-12">
              {featuredImages.length === 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {featuredNews.createdAt 
                          ? format(parseISO(featuredNews.createdAt), 'MMMM d, yyyy')
                          : 'Unknown date'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                      <User className="h-4 w-4" />
                      <span>System Admin</span>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                      <span>{getReadingTime(featuredNews.description)} min read</span>
                    </div>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    {featuredNews.title}
                  </h2>
                </div>
              )}
              <div className="prose prose-invert max-w-none">
                <p className="text-lg md:text-xl text-white/90 leading-relaxed whitespace-pre-wrap">
                  {featuredNews.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </article>
      )}

      {otherNews.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-primary to-accent"></div>
              Latest News
            </h2>
            <span className="text-muted-foreground text-sm">
              {otherNews.length} {otherNews.length === 1 ? 'article' : 'articles'}
            </span>
          </div>
          
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {otherNews.map((item, index) => {
              const images = getImagesList(item.images);
              const currentImgIndex = currentIndex[item.id] || 0;
              const hasMultipleImages = images.length > 1;

              return (
                <article 
                  key={item.id} 
                  className="group animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="glass-card border-primary/20 overflow-hidden hover:border-primary/50 transition-all duration-500 h-full flex flex-col hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2">
                    {images.length > 0 ? (
                      <div 
                        className="relative w-full h-64 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 cursor-pointer"
                        onClick={() => hasMultipleImages && openLightbox(item.id, currentImgIndex)}
                      >
                        {hasMultipleImages && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 h-10 w-10 rounded-full"
                              onClick={(e) => prevImage(item.id, images.length, e)}
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 h-10 w-10 rounded-full"
                              onClick={(e) => nextImage(item.id, images.length, e)}
                            >
                              <ChevronRight className="h-5 w-5" />
                            </Button>
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {images.map((_, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    idx === currentImgIndex
                                      ? "w-6 bg-white shadow-md"
                                      : "w-1.5 bg-white/60"
                                  )}
                                />
                              ))}
                            </div>
                            <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-white text-xs font-medium">
                              {currentImgIndex + 1}/{images.length}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-3 left-3 z-10 bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 h-8 w-8 rounded-lg"
                              onClick={(e) => openLightbox(item.id, currentImgIndex, e)}
                            >
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <img
                          src={images[currentImgIndex]}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Image+Not+Found';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    ) : (
                      <div className="relative w-full h-64 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 flex items-center justify-center border-b border-primary/20">
                        <ImageIcon className="h-16 w-16 text-primary/20" />
                      </div>
                    )}
                    
                    <CardContent className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {item.createdAt 
                              ? formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })
                              : 'Unknown'}
                          </span>
                        </div>
                        <span className="text-primary/40">•</span>
                        <span>{getReadingTime(item.description)} min</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight">
                        {item.title}
                      </h3>
                      
                      <div className="flex-1 mb-4">
                        <p className={cn(
                          "text-sm text-white/70 leading-relaxed transition-all duration-300",
                          expandedNews.has(item.id) ? "" : "line-clamp-3"
                        )}>
                          {item.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                        <div className="flex items-center gap-2 text-xs text-primary/60">
                          <User className="h-3.5 w-3.5" />
                          <span>System Admin</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(item.id)}
                          className="text-xs text-primary/60 hover:text-primary h-auto p-1"
                        >
                          {expandedNews.has(item.id) ? (
                            <>
                              <span className="mr-1">Show Less</span>
                              <ChevronUp className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            <>
                              <span className="mr-1">Read More</span>
                              <ChevronDown className="h-3.5 w-3.5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {lightboxOpen && (() => {
        const newsItem = news.find(n => n.id === lightboxOpen.newsId);
        if (!newsItem) return null;
        const images = getImagesList(newsItem.images);
        const currentImage = images[lightboxOpen.imageIndex];
        const currentIdx = lightboxOpen.imageIndex;

        return (
          <div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setLightboxOpen(null)}
          >
            <div className="relative max-w-7xl max-h-[95vh] w-full flex flex-col">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white h-12 w-12 rounded-full"
                onClick={() => setLightboxOpen(null)}
              >
                <X className="h-6 w-6" />
              </Button>
              
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white h-14 w-14 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      const prevIdx = (currentIdx - 1 + images.length) % images.length;
                      setLightboxOpen({ newsId: lightboxOpen.newsId, imageIndex: prevIdx });
                    }}
                  >
                    <ChevronLeft className="h-7 w-7" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white h-14 w-14 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextIdx = (currentIdx + 1) % images.length;
                      setLightboxOpen({ newsId: lightboxOpen.newsId, imageIndex: nextIdx });
                    }}
                  >
                    <ChevronRight className="h-7 w-7" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm">
                    {currentIdx + 1} / {images.length}
                  </div>
                </>
              )}
              
              <img
                src={currentImage}
                alt={newsItem.title}
                className="w-full h-full object-contain rounded-lg max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x800?text=Image+Not+Found';
                }}
              />
              
              {images.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto justify-center px-4 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxOpen({ newsId: lightboxOpen.newsId, imageIndex: idx });
                      }}
                      className={cn(
                        "relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300",
                        idx === currentIdx
                          ? "border-white scale-110 shadow-lg"
                          : "border-white/30 hover:border-white/60 opacity-70 hover:opacity-100"
                      )}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default News;
