import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

interface FeesChartProps {
  fees: any[];
  isLoading: boolean;
}

const FeesChart = ({ fees, isLoading }: FeesChartProps) => {
  const chartData = useMemo(() => {
    const paid = fees
      .filter((fee) => (fee.status || '').toUpperCase() === 'PAID')
      .reduce((sum, fee) => {
        const amount = parseFloat(fee.amount || fee.feeAmount || '0') || 0;
        return sum + amount;
      }, 0);

    const unpaid = fees
      .filter((fee) => (fee.status || '').toUpperCase() !== 'PAID')
      .reduce((sum, fee) => {
        const amount = parseFloat(fee.amount || fee.feeAmount || '0') || 0;
        return sum + amount;
      }, 0);

    return [
      { name: 'Paid', value: paid, color: '#10b981' },
      { name: 'Unpaid', value: unpaid, color: '#f59e0b' },
    ];
  }, [fees]);

  // Monthly data for bar chart
  const monthlyData = useMemo(() => {
    const monthMap: Record<string, { paid: number; unpaid: number }> = {};

    fees.forEach((fee) => {
      const date = fee.paidAt || fee.createdAt || fee.date;
      if (!date) return;

      try {
        const dateObj = new Date(date);
        const monthKey = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { paid: 0, unpaid: 0 };
        }

        const amount = parseFloat(fee.amount || fee.feeAmount || '0') || 0;
        const status = (fee.status || '').toUpperCase();

        if (status === 'PAID') {
          monthMap[monthKey].paid += amount;
        } else {
          monthMap[monthKey].unpaid += amount;
        }
      } catch {
        // Ignore invalid dates
      }
    });

    return Object.entries(monthMap)
      .map(([month, data]) => ({
        month,
        paid: data.paid,
        unpaid: data.unpaid,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6); // Last 6 months
  }, [fees]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const COLORS = ['#10b981', '#f59e0b'];

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {/* Total vs Unpaid Pie Chart */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Total vs Unpaid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Trend Bar Chart */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Monthly Trend (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={formatCurrency} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="paid" fill="#10b981" name="Paid" />
              <Bar dataKey="unpaid" fill="#f59e0b" name="Unpaid" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeesChart;
