import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { format, parseISO, subMonths, eachMonthOfInterval } from 'date-fns';

interface InsightsChartsProps {
  members: any[];
  events: any[];
  fees: any[];
  financeRecords: any[];
  isLoading: boolean;
  dateRange?: { start: Date; end: Date };
}

const InsightsCharts = ({
  members,
  events,
  fees,
  financeRecords,
  isLoading,
  dateRange,
}: InsightsChartsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Membership Growth Chart Data
  const membershipGrowthData = useMemo(() => {
    const monthMap: Record<string, number> = {};

    // Get date range
    const startDate = dateRange?.start || subMonths(new Date(), 11);
    const endDate = dateRange?.end || new Date();
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    // Initialize all months with 0
    months.forEach((month) => {
      const monthKey = format(month, 'MMM yyyy');
      monthMap[monthKey] = 0;
    });

    // Count members joined per month
    members.forEach((member) => {
      const joinDate = member.joinedAt || member.createdAt || member.registrationDate;
      if (!joinDate) return;

      try {
        const date = new Date(joinDate);
        if (date >= startDate && date <= endDate) {
          const monthKey = format(date, 'MMM yyyy');
          if (monthMap[monthKey] !== undefined) {
            monthMap[monthKey]++;
          }
        }
      } catch {
        // Ignore invalid dates
      }
    });

    // Convert to array and calculate cumulative
    let cumulative = 0;
    return Object.entries(monthMap)
      .map(([month, count]) => {
        cumulative += count;
        return {
          month,
          newMembers: count,
          totalMembers: cumulative,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }, [members, dateRange]);

  // Financial Performance Chart Data
  const financialPerformanceData = useMemo(() => {
    const monthMap: Record<string, { income: number; expenses: number }> = {};

    const startDate = dateRange?.start || subMonths(new Date(), 11);
    const endDate = dateRange?.end || new Date();
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    // Initialize all months
    months.forEach((month) => {
      const monthKey = format(month, 'MMM yyyy');
      monthMap[monthKey] = { income: 0, expenses: 0 };
    });

    // Process fees (income)
    fees.forEach((fee) => {
      const feeDate = fee.paidAt || fee.createdAt || fee.date;
      if (!feeDate) return;

      try {
        const date = new Date(feeDate);
        if (date >= startDate && date <= endDate && (fee.status || '').toUpperCase() === 'PAID') {
          const monthKey = format(date, 'MMM yyyy');
          if (monthMap[monthKey]) {
            monthMap[monthKey].income += parseFloat(fee.amount || fee.feeAmount || '0') || 0;
          }
        }
      } catch {
        // Ignore invalid dates
      }
    });

    // Process finance records
    financeRecords.forEach((record) => {
      const recordDate = record.date || record.createdAt;
      if (!recordDate) return;

      try {
        const date = new Date(recordDate);
        if (date >= startDate && date <= endDate) {
          const monthKey = format(date, 'MMM yyyy');
          if (monthMap[monthKey]) {
            const amount = Math.abs(parseFloat(record.amount || '0') || 0);
            if (record.type === 'income' || (record.amount && record.amount > 0)) {
              monthMap[monthKey].income += amount;
            } else {
              monthMap[monthKey].expenses += amount;
            }
          }
        }
      } catch {
        // Ignore invalid dates
      }
    });

    return Object.entries(monthMap)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        profit: data.income - data.expenses,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }, [fees, financeRecords, dateRange]);

  // Event Participation Chart Data
  const eventParticipationData = useMemo(() => {
    const monthMap: Record<string, { events: number; participation: number }> = {};

    const startDate = dateRange?.start || subMonths(new Date(), 11);
    const endDate = dateRange?.end || new Date();
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    // Initialize all months
    months.forEach((month) => {
      const monthKey = format(month, 'MMM yyyy');
      monthMap[monthKey] = { events: 0, participation: 0 };
    });

    events.forEach((event) => {
      const eventDate = event.startTime || event.date || event.createdAt;
      if (!eventDate) return;

      try {
        const date = new Date(eventDate);
        if (date >= startDate && date <= endDate) {
          const monthKey = format(date, 'MMM yyyy');
          if (monthMap[monthKey]) {
            monthMap[monthKey].events++;
            // Mock participation count (would come from backend)
            monthMap[monthKey].participation += parseInt(event.participantsCount || event.participationCount || '0') || 0;
          }
        }
      } catch {
        // Ignore invalid dates
      }
    });

    return Object.entries(monthMap)
      .map(([month, data]) => ({
        month,
        events: data.events,
        participation: data.participation,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }, [events, dateRange]);

  // Financial Summary Pie Chart
  const financialSummaryData = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;

    // Calculate from fees
    fees
      .filter((fee) => (fee.status || '').toUpperCase() === 'PAID')
      .forEach((fee) => {
        totalIncome += parseFloat(fee.amount || fee.feeAmount || '0') || 0;
      });

    // Calculate from finance records
    financeRecords.forEach((record) => {
      const amount = Math.abs(parseFloat(record.amount || '0') || 0);
      if (record.type === 'income' || (record.amount && record.amount > 0)) {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
      }
    });

    return [
      { name: 'Income', value: totalIncome, color: '#10b981' },
      { name: 'Expenses', value: totalExpenses, color: '#ef4444' },
    ];
  }, [fees, financeRecords]);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card border-primary/20">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Membership Growth Chart */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Membership Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={membershipGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="newMembers"
                stroke="#3b82f6"
                strokeWidth={2}
                name="New Members"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="totalMembers"
                stroke="#10b981"
                strokeWidth={2}
                name="Total Members"
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Financial Performance Chart */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-success" />
            Financial Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financialPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={formatCurrency} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              <Bar dataKey="profit" fill="#3b82f6" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Financial Summary Pie Chart */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={financialSummaryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {financialSummaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Event Participation Chart */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-warning" />
              Event Participation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventParticipationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Bar dataKey="events" fill="#3b82f6" name="Events" />
                <Bar dataKey="participation" fill="#f59e0b" name="Participants" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InsightsCharts;

