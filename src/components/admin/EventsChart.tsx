import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { format, startOfMonth, subMonths, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface EventsChartProps {
  events: any[];
  isLoading?: boolean;
}

const EventsChart = ({ events, isLoading }: EventsChartProps) => {
  const chartData = useMemo(() => {
    if (!events || events.length === 0) return [];

    // Get last 6 months
    const now = new Date();
    const monthsData = Array.from({ length: 6 }, (_, i) => {
      const monthDate = startOfMonth(subMonths(now, 5 - i));
      return {
        month: format(monthDate, 'MMM yyyy'),
        fullDate: monthDate,
        count: 0,
        upcoming: 0,
        past: 0,
      };
    });

    // Count events per month
    // Support both startAt and startTime fields, also check createdAt for events without start dates
    events.forEach((event) => {
      // Try multiple date fields
      const eventDateStr = event.startAt || event.startTime || event.date || event.createdAt;
      if (!eventDateStr) {
        // If no date at all, skip this event
        return;
      }
      
      try {
        const eventDate = parseISO(eventDateStr);
        if (isNaN(eventDate.getTime())) {
          // Try as Date object if parseISO fails
          const dateObj = new Date(eventDateStr);
          if (isNaN(dateObj.getTime())) {
            return; // Invalid date
          }
        }
        
        const eventDateValid = !isNaN(eventDate.getTime()) ? eventDate : new Date(eventDateStr);
        
        const monthIndex = monthsData.findIndex((m) => {
          return m.fullDate.getMonth() === eventDateValid.getMonth() &&
                 m.fullDate.getFullYear() === eventDateValid.getFullYear();
        });

        if (monthIndex >= 0) {
          monthsData[monthIndex].count++;
          // Check if event is upcoming (use startAt/startTime, not createdAt)
          const startDateStr = event.startAt || event.startTime || event.date;
          if (startDateStr) {
            try {
              const startDate = parseISO(startDateStr);
              if (!isNaN(startDate.getTime()) && startDate > now) {
                monthsData[monthIndex].upcoming++;
              } else {
                monthsData[monthIndex].past++;
              }
            } catch {
              // If we can't determine, count as past
              monthsData[monthIndex].past++;
            }
          } else {
            // No start date, count as past
            monthsData[monthIndex].past++;
          }
        } else {
          // Event date is outside the 6-month range, but we still count it
          // Add to the closest month
          const closestIndex = monthsData.findIndex((m) => m.fullDate > eventDateValid);
          if (closestIndex >= 0) {
            monthsData[closestIndex].count++;
            monthsData[closestIndex].past++;
          } else if (monthsData.length > 0) {
            // Add to last month if event is in the future
            monthsData[monthsData.length - 1].count++;
            monthsData[monthsData.length - 1].upcoming++;
          }
        }
      } catch {
        // Skip invalid dates
      }
    });

    return monthsData;
  }, [events]);

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20 glow-effect">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 glow-effect">
      <CardHeader>
        <CardTitle className="text-xl neon-text text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-success" />
          Events Overview
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Events created per month (last 6 months)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isLoading && (chartData.length === 0 || chartData.every(d => d.count === 0)) ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No event data available</p>
              {events && events.length > 0 && (
                <p className="text-xs mt-2">Found {events.length} event(s) but no valid dates</p>
              )}
            </div>
          </div>
        ) : chartData.length > 0 && chartData.some(d => d.count > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="rgba(255, 255, 255, 0.7)"
                tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.7)"
                tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(26, 11, 46, 0.95)',
                  border: '1px solid rgba(248, 181, 0, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend 
                wrapperStyle={{ color: 'rgba(255, 255, 255, 0.7)' }}
              />
              <Bar dataKey="upcoming" name="Upcoming Events" fill="#6a4c93" radius={[8, 8, 0, 0]} />
              <Bar dataKey="past" name="Past Events" fill="#f8b500" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default EventsChart;

