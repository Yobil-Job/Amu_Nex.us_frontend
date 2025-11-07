import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

interface FinanceOverviewProps {
  income: number;
  expenses: number;
  balance: number;
  isLoading: boolean;
}

const FinanceOverview = ({ income, expenses, balance, isLoading }: FinanceOverviewProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

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

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Income */}
      <Card className="glass-card border-success/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Income</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(income)}</p>
              <p className="text-xs text-success mt-1">From fees & donations</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10">
              <ArrowUpCircle className="h-6 w-6 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Expenses */}
      <Card className="glass-card border-destructive/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(expenses)}</p>
              <p className="text-xs text-destructive mt-1">Spent on activities</p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10">
              <ArrowDownCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance */}
      <Card className={`glass-card ${balance >= 0 ? 'border-primary/20' : 'border-warning/20'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-white' : 'text-warning'}`}>
                {formatCurrency(Math.abs(balance))}
              </p>
              <p className={`text-xs mt-1 ${balance >= 0 ? 'text-success' : 'text-warning'}`}>
                {balance >= 0 ? 'Available' : 'Deficit'}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${balance >= 0 ? 'bg-primary/10' : 'bg-warning/10'}`}>
              <Wallet className={`h-6 w-6 ${balance >= 0 ? 'text-primary' : 'text-warning'}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Profit/Loss */}
      <Card className="glass-card border-accent/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Net Profit/Loss</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {balance >= 0 ? 'Profit' : 'Loss'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-accent/10">
              {balance >= 0 ? (
                <TrendingUp className="h-6 w-6 text-success" />
              ) : (
                <TrendingDown className="h-6 w-6 text-destructive" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceOverview;

