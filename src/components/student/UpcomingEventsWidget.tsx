import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Building2, ChevronRight, List, Calendar as CalendarIcon, TrendingUp, AlertCircle, Flame } from 'lucide-react';
import { format, parseISO, isAfter, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { useState, useMemo } from 'react';
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());

  const upcomingEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    const now = new Date();
    return events
      .filter(event => {
        if (!event) return false;
        // Check multiple possible date fields
        const eventDateStr = event.startAt || event.startDate || event.date;
        if (!eventDateStr) return false;
        try {
          const eventDate = parseISO(eventDateStr);
          if (isNaN(eventDate.getTime())) {
            // Fallback to Date constructor if parseISO fails
            const fallbackDate = new Date(eventDateStr);
            if (isNaN(fallbackDate.getTime())) return false;
            return isAfter(fallbackDate, now);
          }
          return isAfter(eventDate, now);
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const aDateStr = a.startAt || a.startDate || a.date;
        const bDateStr = b.startAt || b.startDate || b.date;
        if (!aDateStr || !bDateStr) return 0;
        try {
          const aDate = parseISO(aDateStr);
          const bDate = parseISO(bDateStr);
          if (isNaN(aDate.getTime()) || isNaN(bDate.getTime())) {
            // Fallback to Date constructor
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

  const isSoon = (eventDate: string) => {
    try {
      const date = parseISO(eventDate);
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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const calendarDays = useMemo(() => {
    const firstDayOfWeek = monthStart.getDay();
    const lastDayOfWeek = monthEnd.getDay();
    
    const prevMonthDays = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - i - 1);
      prevMonthDays.push(date);
    }

    const nextMonthDays = [];
    for (let i = 1; i <= (6 - lastDayOfWeek); i++) {
      const date = new Date(monthEnd);
      date.setDate(date.getDate() + i);
      nextMonthDays.push(date);
    }

    return [...prevMonthDays, ...daysInMonth, ...nextMonthDays];
  }, [monthStart, monthEnd, daysInMonth]);

  const getEventsForDate = (date: Date) => {
    return upcomingEvents.filter(event => {
      if (!event || !event.id) return false;
      // Check multiple possible date fields
      const eventDateStr = event.startAt || event.startDate || event.date;
      if (!eventDateStr) return false;
      try {
        const eventDate = parseISO(eventDateStr);
        if (isNaN(eventDate.getTime())) {
          // Fallback to Date constructor
          const fallbackDate = new Date(eventDateStr);
          if (isNaN(fallbackDate.getTime())) return false;
          return isSameDay(fallbackDate, date);
        }
        return isSameDay(eventDate, date);
      } catch {
        return false;
      }
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    <Card className="glass-card border-primary/20 glow-effect h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-success" />
            Upcoming Events
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            {upcomingEvents.length} {upcomingEvents.length === 1 ? 'event' : 'events'} scheduled
            {upcomingEvents.length > 0 && (
              <span className="ml-2 text-accent">
                • {upcomingEvents.filter(e => isSoon(e.startAt || '')).length} soon
              </span>
            )}
          </CardDescription>
        </div>
        <div className="p-3 rounded-xl bg-success/10 shadow-sm animate-float">
          <Calendar className="h-6 w-6 text-success" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-3 mt-4">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="glass-card p-3 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all cursor-pointer hover:scale-[1.01]"
                    onClick={() => navigate('/events')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-white truncate mb-1">
                          {event.title || 'Untitled Event'}
                        </div>
                        {event.club && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Building2 className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {event.club.title || event.club.name || 'Unknown Club'}
                            </span>
                          </div>
                        )}
                        {(() => {
                          const eventDateStr = event.startAt || event.startDate || event.date;
                          if (!eventDateStr) return null;
                          try {
                            const eventDate = parseISO(eventDateStr);
                            if (isNaN(eventDate.getTime())) {
                              const fallbackDate = new Date(eventDateStr);
                              if (isNaN(fallbackDate.getTime())) return null;
                              return (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  <span>
                                    {format(fallbackDate, 'MMM dd, yyyy HH:mm')}
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span>
                                  {format(eventDate, 'MMM dd, yyyy HH:mm')}
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
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                  ←
                </Button>
                <h4 className="text-sm font-semibold">
                  {format(currentDate, 'MMMM yyyy')}
                </h4>
                <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                  →
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-muted-foreground p-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const isCurrentMonth = isSameMonth(date, currentDate);
                  const isToday = isSameDay(date, new Date());
                  const dayEvents = getEventsForDate(date);
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[40px] p-1 border rounded text-xs
                        ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                        ${isToday ? 'ring-2 ring-primary' : ''}
                        ${hasEvents ? 'cursor-pointer hover:bg-primary/5' : ''}
                        transition-colors
                      `}
                    >
                      <div className={`text-center mb-1 ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {format(date, 'd')}
                      </div>
                      {hasEvents && (
                        <div className="h-1.5 w-full bg-primary rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {upcomingEvents.length > 0 && (
          <div className="pt-3 border-t border-primary/20">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-primary/20 hover:bg-primary/10"
              onClick={handleViewAll}
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

