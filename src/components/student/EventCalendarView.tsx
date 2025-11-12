import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { useState, useMemo } from 'react';

interface EventCalendarViewProps {
  events: any[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: any) => void;
}

const EventCalendarView = ({ events, onDateClick, onEventClick }: EventCalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add days from previous/next month to fill the calendar grid
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
    return events.filter(event => {
      if (!event || !event.id) return false;
      // Robust date extraction
      const dateStr = event.startAt || event.startDate || event.date;
      if (!dateStr) return false;
      try {
        const eventDate = parseISO(dateStr);
        if (isNaN(eventDate.getTime())) {
          const fallbackDate = new Date(dateStr);
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

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Calendar View
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
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
                  min-h-[80px] p-1 border rounded-md
                  ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                  ${isToday ? 'ring-2 ring-primary' : ''}
                  ${hasEvents ? 'cursor-pointer hover:bg-primary/5' : ''}
                  transition-colors
                `}
                onClick={() => {
                  if (hasEvents && onEventClick && dayEvents.length > 0) {
                    // If clicking on a day with events, open the first event
                    onEventClick(dayEvents[0]);
                  } else if (hasEvents && onDateClick) {
                    onDateClick(date);
                  }
                }}
                style={{ pointerEvents: 'auto' }}
              >
                <div className="text-xs font-medium mb-1">
                  {format(date, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs p-1 bg-primary/10 text-primary rounded truncate cursor-pointer hover:bg-primary/20 transition-colors"
                      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Event clicked in calendar:', event.id);
                        onEventClick?.(event);
                      }}
                      title={event.title || 'Event'}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          onEventClick?.(event);
                        }
                      }}
                    >
                      {event.title || 'Event'}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCalendarView;
