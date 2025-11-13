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
    if (!fees || fees.length === 0) {
      if (import.meta.env.DEV) {
        console.log('📊 FeesChart: No fees data', { fees });
      }
      return [
        { name: 'Paid', value: 0, color: '#10b981' },
        { name: 'Unpaid', value: 0, color: '#f59e0b' },
      ];
    }

    const paid = fees
      .filter((fee) => {
        const status = (fee.status || fee.paymentStatus || '').toUpperCase();
        return status === 'PAID';
      })
      .reduce((sum, fee) => {
        const amount = parseFloat(fee.amount || fee.feeAmount || fee.fee || fee.total || '0') || 0;
        return sum + amount;
      }, 0);

    const unpaid = fees
      .filter((fee) => {
        const status = (fee.status || fee.paymentStatus || '').toUpperCase();
        return status !== 'PAID';
      })
      .reduce((sum, fee) => {
        const amount = parseFloat(fee.amount || fee.feeAmount || fee.fee || fee.total || '0') || 0;
        return sum + amount;
      }, 0);

    if (import.meta.env.DEV) {
      console.log('📊 FeesChart: Processed data', {
        feeCount: fees.length,
        paid,
        unpaid,
        sampleFee: fees[0],
      });
    }

    return [
      { name: 'Paid', value: paid, color: '#10b981' },
      { name: 'Unpaid', value: unpaid, color: '#f59e0b' },
    ];
  }, [fees]);

  // Monthly data for bar chart
  const monthlyData = useMemo(() => {
    const monthMap: Record<string, { paid: number; unpaid: number }> = {};

    fees.forEach((fee) => {
      // Check multiple date fields
      const date = fee.paidAt || fee.paid_at || fee.paymentDate || fee.payment_date || fee.createdAt || fee.created_at || fee.date;
      if (!date) return;

      try {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return;
        
        const monthKey = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { paid: 0, unpaid: 0 };
        }

        // Check multiple amount fields
        const amount = parseFloat(fee.amount || fee.feeAmount || fee.fee || fee.total || '0') || 0;
        const status = (fee.status || fee.paymentStatus || '').toUpperCase();

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
      <Card className="glass-card border-primary/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/40">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Total vs Unpaid
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 || (chartData[0].value === 0 && chartData[1].value === 0) ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
              <DollarSign className="h-12 w-12 mb-3 opacity-50" />
              <p>No fee data available</p>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Monthly Trend Bar Chart */}
      <Card className="glass-card border-primary/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/40">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Monthly Trend (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
              <TrendingUp className="h-12 w-12 mb-3 opacity-50" />
              <p>No fee data available</p>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FeesChart;
