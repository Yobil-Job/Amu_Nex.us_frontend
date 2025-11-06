import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign } from 'lucide-react';
import { useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface FeesChartProps {
  fees: any[];
  isLoading: boolean;
}

const FeesChart = ({ fees, isLoading }: FeesChartProps) => {
  const chartData = useMemo(() => {
    if (!fees || fees.length === 0) return [];

    // Get last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, 'MMM dd'),
        fullDate: date,
        amount: 0,
        cumulative: 0,
      };
    });

    // Calculate daily fees and cumulative total
    fees.forEach((fee: any) => {
      const feeDate = fee.paymentDate || fee.createdAt || fee.date;
      if (feeDate && fee.amount) {
        try {
          const date = parseISO(feeDate);
          const dayIndex = last30Days.findIndex((d) => {
            return d.fullDate.toDateString() === date.toDateString();
          });
          if (dayIndex >= 0) {
            last30Days[dayIndex].amount += fee.amount || 0;
          }
        } catch {
          // Ignore invalid dates
        }
      }
    });

    // Calculate cumulative total
    let cumulative = 0;
    last30Days.forEach((day) => {
      cumulative += day.amount;
      day.cumulative = cumulative;
    });

    return last30Days;
  }, [fees]);

  return (
    <Card className="glass-card border-primary/20 glow-effect">
      <CardHeader>
        <CardTitle className="text-xl neon-text text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Fee Collection Trend
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Daily fees collected and cumulative total over the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <DollarSign className="h-12 w-12 mb-3 opacity-50" />
            <p>No fee data available</p>
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
                yAxisId="left"
              />
              <YAxis
                stroke="rgba(255, 255, 255, 0.7)"
                tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                yAxisId="right"
                orientation="right"
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(26, 11, 46, 0.95)',
                  border: '1px solid rgba(248, 181, 0, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'cumulative') {
                    return [`ETB ${value.toLocaleString()}`, 'Cumulative Total'];
                  }
                  return [`ETB ${value.toLocaleString()}`, 'Daily Amount'];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="amount"
                stroke="#f8b500"
                strokeWidth={2}
                dot={{ fill: '#f8b500', r: 4 }}
                name="Daily Amount"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                stroke="#6a4c93"
                strokeWidth={2}
                dot={{ fill: '#6a4c93', r: 4 }}
                name="Cumulative Total"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default FeesChart;

