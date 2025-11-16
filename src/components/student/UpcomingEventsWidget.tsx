import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Building2, ChevronRight, TrendingUp, AlertCircle, Flame } from 'lucide-react';
import { format, parseISO, isAfter, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface Event {
  id: number;
  title?: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  latitude?: number;
  longitude?: number;
  club?: {
    id: number;
    title?: string;
    name?: string;
  };
}

interface UpcomingEventsWidgetProps {
  events: Event[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

const UpcomingEventsWidget = ({ events, isLoading, onViewAll }: UpcomingEventsWidgetProps) => {
  const navigate = useNavigate();

  const upcomingEvents = useMemo(() => {
    if (!events || events.length === 0) {
      return [];
    }
    
    const now = new Date();
    // Show ALL events, but prioritize upcoming ones
    // If event has no date or invalid date, still show it (might be a data issue)
    const filtered = events
      .filter(event => {
        if (!event || !event.id) {
          return false;
        }
        // Accept all events - we'll sort by date later
        return true;
      })
      .map(event => {
        // Add a flag to indicate if event is upcoming
        const eventDateStr = event.startAt || event.startDate || event.date;
        let isUpcoming = false;
        let hasValidDate = false;
        
        if (eventDateStr) {
          try {
            const eventDate = parseISO(eventDateStr);
            let finalDate: Date;
            if (isNaN(eventDate.getTime())) {
              const fallbackDate = new Date(eventDateStr);
              if (!isNaN(fallbackDate.getTime())) {
                finalDate = fallbackDate;
                hasValidDate = true;
                isUpcoming = isAfter(finalDate, now);
              }
            } else {
              finalDate = eventDate;
              hasValidDate = true;
                isUpcoming = isAfter(finalDate, now);
              }
          } catch (error) {
            // Date parsing error
          }
        }
        
        return {
          ...event,
          _isUpcoming: isUpcoming,
          _hasValidDate: hasValidDate,
        };
      })
      .sort((a: any, b: any) => {
        // Sort: upcoming first, then by date
        if (a._isUpcoming !== b._isUpcoming) {
          return a._isUpcoming ? -1 : 1;
        }
        
        const aDateStr = a.startAt || a.startDate || a.date;
        const bDateStr = b.startAt || b.startDate || b.date;
        
        if (!aDateStr && !bDateStr) return 0;
        if (!aDateStr) return 1; // Events without dates go to end
        if (!bDateStr) return -1;
        
        try {
          const aDate = parseISO(aDateStr);
          const bDate = parseISO(bDateStr);
          if (isNaN(aDate.getTime()) || isNaN(bDate.getTime())) {
            const aFallback = new Date(aDateStr);
            const bFallback = new Date(bDateStr);
            if (isNaN(aFallback.getTime()) || isNaN(bFallback.getTime())) return 0;
            return aFallback.getTime() - bFallback.getTime();
          }
          return aDate.getTime() - bDate.getTime();
        } catch {
          return 0;
        }
      });
    
    return filtered;
  }, [events]);

  const eventsByClub = useMemo(() => {
    const clubMap: Record<string, number> = {};
    upcomingEvents.forEach(event => {
      const clubName = event.club?.title || event.club?.name || 'Unknown';
      clubMap[clubName] = (clubMap[clubName] || 0) + 1;
    });
    return Object.entries(clubMap).map(([club, count]) => ({ club, count }));
  }, [upcomingEvents]);

  const getTimeUntilEvent = (eventDate: string) => {
    try {
      const date = parseISO(eventDate);
      const now = new Date();
      const days = differenceInDays(date, now);
      const hours = differenceInHours(date, now);
      const minutes = differenceInMinutes(date, now);

      if (days > 7) return `${days} days`;
      if (days > 0) return `${days}d ${hours % 24}h`;
      if (hours > 0) return `${hours}h ${minutes % 60}m`;
      if (minutes > 0) return `${minutes}m`;
      return 'Starting soon!';
    } catch {
      return 'Soon';
    }
  };

  const isSoon = (eventDateStr?: string) => {
    if (!eventDateStr) return false;
    try {
      const date = parseISO(eventDateStr);
      if (isNaN(date.getTime())) {
        const fallbackDate = new Date(eventDateStr);
        if (isNaN(fallbackDate.getTime())) return false;
        const now = new Date();
        const days = differenceInDays(fallbackDate, now);
        return days <= 3 && days >= 0;
      }
      const now = new Date();
      const days = differenceInDays(date, now);
      return days <= 3 && days >= 0;
    } catch {
      return false;
    }
  };

  const displayedEvents = useMemo(() => upcomingEvents.slice(0, 5), [upcomingEvents]);

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/events');
    }
  };

  const handleEventClick = (eventId: number) => {
    navigate('/events', { state: { eventId } });
  };

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

  return (
    <Card className="glass-card border-primary/20 glow-effect h-full" style={{ pointerEvents: 'auto' }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-success" />
            Upcoming Events
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            {upcomingEvents.length} {upcomingEvents.length === 1 ? 'event' : 'events'} total
            {upcomingEvents.length > 0 && (
              <>
                <span className="ml-2 text-success">
                  • {upcomingEvents.filter((e: any) => e._isUpcoming).length} upcoming
                </span>
                <span className="ml-2 text-accent">
                  • {upcomingEvents.filter((e: any) => isSoon(e.startAt || e.startDate || e.date || '')).length} soon
                </span>
              </>
            )}
          </CardDescription>
        </div>
        <div className="p-3 rounded-xl bg-success/10 shadow-sm animate-float">
          <Calendar className="h-6 w-6 text-success" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4" style={{ pointerEvents: 'auto' }}>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent" style={{ pointerEvents: 'auto' }}>
            {upcomingEvents.map((event: any) => {
              const eventDateStr = event.startAt || event.startDate || event.date;
              const isEventSoon = isSoon(eventDateStr);
              const isUpcoming = event._isUpcoming;
              
              return (
                <div
                  key={event.id}
                  className="glass-card p-3 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEventClick(event.id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleEventClick(event.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold text-sm text-white truncate">
                          {event.title || 'Untitled Event'}
                        </div>
                        {isEventSoon && (
                          <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                            Soon
                          </Badge>
                        )}
                        {!isUpcoming && event._hasValidDate && (
                          <Badge variant="outline" className="text-xs bg-muted/20 text-muted-foreground">
                            Past
                          </Badge>
                        )}
                        {!event._hasValidDate && (
                          <Badge variant="outline" className="text-xs bg-warning/20 text-warning">
                            No Date
                          </Badge>
                        )}
                      </div>
                      {event.club && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {event.club.title || event.club.name || 'Unknown Club'}
                          </span>
                        </div>
                      )}
                      {eventDateStr && (() => {
                        try {
                          const eventDate = parseISO(eventDateStr);
                          let displayDate: Date;
                          if (isNaN(eventDate.getTime())) {
                            const fallbackDate = new Date(eventDateStr);
                            if (isNaN(fallbackDate.getTime())) return null;
                            displayDate = fallbackDate;
                          } else {
                            displayDate = eventDate;
                          }
                          return (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span>
                                {format(displayDate, 'MMM dd, yyyy HH:mm')}
                              </span>
                            </div>
                          );
                        } catch {
                          return null;
                        }
                      })()}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <div className="pt-3 border-t border-primary/20">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-primary/20 hover:bg-primary/10"
              style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10, cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleViewAll();
              }}
            >
              View All Events
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEventsWidget;

