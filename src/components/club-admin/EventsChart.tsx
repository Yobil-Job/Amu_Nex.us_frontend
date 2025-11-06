import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar } from 'lucide-react';
import { useMemo } from 'react';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface EventsChartProps {
  events: any[];
  isLoading: boolean;
}

const EventsChart = ({ events, isLoading }: EventsChartProps) => {
  const chartData = useMemo(() => {
    if (!events || events.length === 0) return [];

    // Get last 6 months
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, 'MMM yyyy'),
        fullDate: startOfMonth(date),
        count: 0,
      };
    });

    // Count events by month
    events.forEach((event: any) => {
      const eventDate = event.startAt || event.createdAt;
      if (eventDate) {
        try {
          const date = parseISO(eventDate);
          const monthStart = startOfMonth(date);
          const monthIndex = last6Months.findIndex((m) => {
            return m.fullDate.getTime() === monthStart.getTime();
          });
          if (monthIndex >= 0) {
            last6Months[monthIndex].count++;
          }
        } catch {
          // Ignore invalid dates
        }
      }
    });

    return last6Months;
  }, [events]);

  return (
    <Card className="glass-card border-primary/20 glow-effect">
      <CardHeader>
        <CardTitle className="text-xl neon-text text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Events Per Month
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Event count over the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <Calendar className="h-12 w-12 mb-3 opacity-50" />
            <p>No event data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis
                dataKey="month"
                stroke="rgba(255, 255, 255, 0.7)"
                tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
              />
              <YAxis
                stroke="rgba(255, 255, 255, 0.7)"
                tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(26, 11, 46, 0.95)',
                  border: '1px solid rgba(248, 181, 0, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#f8b500" radius={[8, 8, 0, 0]} name="Events" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default EventsChart;

