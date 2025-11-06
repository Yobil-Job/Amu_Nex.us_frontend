import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface MemberGrowthChartProps {
  members: any[];
  isLoading: boolean;
}

const MemberGrowthChart = ({ members, isLoading }: MemberGrowthChartProps) => {
  const chartData = useMemo(() => {
    if (!members || members.length === 0) return [];

    // Get last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, 'MMM dd'),
        fullDate: date,
        count: 0,
      };
    });

    // Count members by join date (using createdAt or joinedAt if available)
    members.forEach((member: any) => {
      const joinDate = member.createdAt || member.joinedAt || member.dateJoined;
      if (joinDate) {
        try {
          const memberDate = parseISO(joinDate);
          const dayIndex = last30Days.findIndex((d) => {
            return d.fullDate.toDateString() === memberDate.toDateString();
          });
          if (dayIndex >= 0) {
            // Increment count for this day and all subsequent days
            for (let i = dayIndex; i < last30Days.length; i++) {
              last30Days[i].count++;
            }
          }
        } catch {
          // Ignore invalid dates
        }
      }
    });

    return last30Days;
  }, [members]);

  return (
    <Card className="glass-card border-primary/20 glow-effect">
      <CardHeader>
        <CardTitle className="text-xl neon-text text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Member Growth
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Member count over the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-3 opacity-50" />
            <p>No member data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis
                dataKey="date"
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
              <Line
                type="monotone"
                dataKey="count"
                stroke="#f8b500"
                strokeWidth={2}
                dot={{ fill: '#f8b500', r: 4 }}
                name="Members"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberGrowthChart;

