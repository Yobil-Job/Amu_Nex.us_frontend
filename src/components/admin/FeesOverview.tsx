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
      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.total)}</div>
          </div>
          <div className="text-sm text-muted-foreground">Total Fees</div>
          <div className="text-xs text-muted-foreground mt-1">{stats.totalCount} transactions</div>
        </CardContent>
      </Card>

      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div className="text-2xl font-bold text-success">{formatCurrency(stats.paid)}</div>
          </div>
          <div className="text-sm text-muted-foreground">Paid</div>
          <div className="text-xs text-muted-foreground mt-1">{stats.paidCount} transactions</div>
        </CardContent>
      </Card>

      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-warning" />
            <div className="text-2xl font-bold text-warning">{formatCurrency(stats.pending)}</div>
          </div>
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-xs text-muted-foreground mt-1">{stats.pendingCount} transactions</div>
        </CardContent>
      </Card>

      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <div className="text-2xl font-bold text-destructive">{formatCurrency(stats.failed)}</div>
          </div>
          <div className="text-sm text-muted-foreground">Failed</div>
          <div className="text-xs text-muted-foreground mt-1">{stats.failedCount} transactions</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeesOverview;

