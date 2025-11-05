import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CheckCircle2, Clock, XCircle, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

interface Fee {
  id: number;
  amount?: number;
  status?: string;
  club?: {
    id: number;
    title?: string;
    name?: string;
  };
}

interface FeeSummaryProps {
  fees: Fee[];
}

const FeeSummary = ({ fees }: FeeSummaryProps) => {
  const stats = useMemo(() => {
    const validFees = fees.filter(f => f && f.id);
    
    const totalPaid = validFees
      .filter(f => f.status?.toUpperCase() === 'PAID')
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    const totalPending = validFees
      .filter(f => f.status?.toUpperCase() === 'PENDING')
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    const totalFailed = validFees
      .filter(f => f.status?.toUpperCase() === 'FAILED')
      .reduce((sum, f) => sum + (f.amount || 0), 0);

    const totalAll = validFees.reduce((sum, f) => sum + (f.amount || 0), 0);

    const paidCount = validFees.filter(f => f.status?.toUpperCase() === 'PAID').length;
    const pendingCount = validFees.filter(f => f.status?.toUpperCase() === 'PENDING').length;
    const failedCount = validFees.filter(f => f.status?.toUpperCase() === 'FAILED').length;

    // Calculate club-wise totals
    const clubTotals: Record<number, { name: string; total: number; count: number }> = {};
    validFees.forEach(fee => {
      if (fee.club?.id) {
        const clubId = fee.club.id;
        const clubName = fee.club.title || fee.club.name || `Club ${clubId}`;
        if (!clubTotals[clubId]) {
          clubTotals[clubId] = { name: clubName, total: 0, count: 0 };
        }
        if (fee.status?.toUpperCase() === 'PAID') {
          clubTotals[clubId].total += fee.amount || 0;
        }
        clubTotals[clubId].count += 1;
      }
    });

    return {
      totalPaid,
      totalPending,
      totalFailed,
      totalAll,
      paidCount,
      pendingCount,
      failedCount,
      totalCount: validFees.length,
      clubTotals: Object.values(clubTotals),
    };
  }, [fees]);

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Paid */}
      <Card className="border-success/20 bg-success/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Paid
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold">${stats.totalPaid.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.paidCount} {stats.paidCount === 1 ? 'payment' : 'payments'}
          </p>
        </CardContent>
      </Card>

      {/* Pending */}
      <Card className="border-warning/20 bg-warning/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              <span className="text-2xl font-bold">${stats.totalPending.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.pendingCount} {stats.pendingCount === 1 ? 'payment' : 'payments'}
          </p>
        </CardContent>
      </Card>

      {/* Failed */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold">${stats.totalFailed.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.failedCount} {stats.failedCount === 1 ? 'payment' : 'payments'}
          </p>
        </CardContent>
      </Card>

      {/* Total All */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Fees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">${stats.totalAll.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.totalCount} {stats.totalCount === 1 ? 'record' : 'records'}
          </p>
        </CardContent>
      </Card>

      {/* Club-wise Breakdown */}
      {stats.clubTotals.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Breakdown by Club
            </CardTitle>
            <CardDescription>
              Total paid fees per club
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {stats.clubTotals.map((club, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{club.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {club.count} {club.count === 1 ? 'fee' : 'fees'}
                    </p>
                  </div>
                  <div className="ml-3 text-right">
                    <p className="font-semibold text-lg">${club.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeeSummary;
