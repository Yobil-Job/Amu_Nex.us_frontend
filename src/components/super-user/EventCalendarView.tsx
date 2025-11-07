import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, isToday, addMonths, subMonths } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface EventCalendarViewProps {
  events: any[];
  isLoading: boolean;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: any) => void;
}

const EventCalendarView = ({ events, isLoading, onDateClick, onEventClick }: EventCalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week for the month
  const firstDayOfWeek = monthStart.getDay();
  const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const eventsByDate = useMemo(() => {
    const eventsMap: Record<string, any[]> = {};
    events.forEach((event) => {
      if (!event.startAt) return;
      try {
        const eventDate = parseISO(event.startAt);
        const dateKey = format(eventDate, 'yyyy-MM-dd');
        if (!eventsMap[dateKey]) {
          eventsMap[dateKey] = [];
        }
        eventsMap[dateKey].push(event);
      } catch {
        // Ignore invalid dates
      }
    });
    return eventsMap;
  }, [events]);

  const getEventsForDate = (date: Date): any[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return eventsByDate[dateKey] || [];
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20">
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
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2 text-white">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Event Calendar
            </CardTitle>
            <CardDescription>View events by month</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Month Header */}
          <div className="text-center text-lg font-semibold text-white mb-4">
            {format(currentMonth, 'MMMM yyyy')}
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Days before month start */}
            {daysBeforeMonth.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Days in month */}
            {daysInMonth.map((day) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentDay = isToday(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <div
                  key={day.toISOString()}
                  className={`aspect-square p-1 border border-primary/20 rounded-lg cursor-pointer transition-all hover:bg-primary/10 ${
                    isCurrentDay ? 'bg-primary/20 border-primary' : ''
                  } ${!isCurrentMonth ? 'opacity-30' : ''}`}
                  onClick={() => onDateClick?.(day)}
                >
                  <div className="flex flex-col h-full">
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isCurrentDay ? 'text-primary' : 'text-white'
                      }`}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs bg-primary/20 text-primary rounded px-1 mb-0.5 truncate cursor-pointer hover:bg-primary/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 pt-4 border-t border-primary/20">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/20 border border-primary" />
              <span className="text-sm text-muted-foreground">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/20" />
              <span className="text-sm text-muted-foreground">Has Events</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCalendarView;

