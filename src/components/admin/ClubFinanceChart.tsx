import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

interface ClubFinanceChartProps {
  fees: any[];
  clubs: any[];
  isLoading: boolean;
}

const ClubFinanceChart = ({ fees, clubs, isLoading }: ClubFinanceChartProps) => {
  const chartData = useMemo(() => {
    if (!fees || fees.length === 0 || !clubs || clubs.length === 0) return [];

    // Calculate total fees per club
    const clubTotals: Record<number, { name: string; total: number; paid: number; pending: number }> = {};

    clubs.forEach((club) => {
      clubTotals[club.id] = {
        name: (club.title || club.name || `Club ${club.id}`).substring(0, 20),
        total: 0,
        paid: 0,
        pending: 0,
      };
    });

    fees.forEach((fee) => {
      const clubId = fee.club?.id || fee.clubId;
      if (!clubId || !clubTotals[clubId]) return;

      const amount = parseFloat(fee.amount || fee.feeAmount || '0') || 0;
      clubTotals[clubId].total += amount;

      const status = (fee.status || '').toUpperCase();
      if (status === 'PAID') {
        clubTotals[clubId].paid += amount;
      } else if (status === 'PENDING') {
        clubTotals[clubId].pending += amount;
      }
    });

    return Object.values(clubTotals)
      .filter((club) => club.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10 clubs
  }, [fees, clubs]);

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
        <CardTitle className="text-xl flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Club Finance Statistics
        </CardTitle>
        <CardDescription>Total fees collected by club (Top 10)</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No financial data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.5)"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => `$${value.toFixed(2)}`}
              />
              <Legend />
              <Bar dataKey="paid" fill="#10b981" name="Paid" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubFinanceChart;

