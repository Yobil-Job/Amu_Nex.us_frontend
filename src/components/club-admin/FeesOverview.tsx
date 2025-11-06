import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

interface FeesOverviewProps {
  fees: any[];
  isLoading: boolean;
}

const FeesOverview = ({ fees, isLoading }: FeesOverviewProps) => {
  const stats = useMemo(() => {
    const total = fees.reduce((sum, fee) => {
      const amount = parseFloat(fee.amount || fee.feeAmount || '0') || 0;
      return sum + amount;
    }, 0);

    const paid = fees
      .filter((fee) => (fee.status || '').toUpperCase() === 'PAID')
      .reduce((sum, fee) => {
        const amount = parseFloat(fee.amount || fee.feeAmount || '0') || 0;
        return sum + amount;
      }, 0);

    const pending = fees
      .filter((fee) => (fee.status || '').toUpperCase() === 'PENDING')
      .reduce((sum, fee) => {
        const amount = parseFloat(fee.amount || fee.feeAmount || '0') || 0;
        return sum + amount;
      }, 0);

    const failed = fees
      .filter((fee) => (fee.status || '').toUpperCase() === 'FAILED')
      .reduce((sum, fee) => {
        const amount = parseFloat(fee.amount || fee.feeAmount || '0') || 0;
        return sum + amount;
      }, 0);

    const paidCount = fees.filter((fee) => (fee.status || '').toUpperCase() === 'PAID').length;
    const pendingCount = fees.filter((fee) => (fee.status || '').toUpperCase() === 'PENDING').length;
    const failedCount = fees.filter((fee) => (fee.status || '').toUpperCase() === 'FAILED').length;

    return {
      total,
      paid,
      pending,
      failed,
      totalCount: fees.length,
      paidCount,
      pendingCount,
      failedCount,
    };
  }, [fees]);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card border-primary/20">
            <CardContent className="p-4">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Collected */}
      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Collected</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.total)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.totalCount} payments</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paid */}
      <Card className="glass-card border-success/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Paid</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.paid)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.paidCount} payments</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending */}
      <Card className="glass-card border-warning/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.pending)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.pendingCount} payments</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10">
              <Clock className="h-6 w-6 text-warning" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Failed */}
      <Card className="glass-card border-destructive/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Failed</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.failed)}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.failedCount} payments</p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeesOverview;

