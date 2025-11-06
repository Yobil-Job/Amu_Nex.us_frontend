import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, User, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/admin/EmptyState';

interface FeesTableProps {
  fees: any[];
  isLoading: boolean;
}

const FeesTable = ({ fees, isLoading }: FeesTableProps) => {
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(numAmount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch {
      try {
        const date = new Date(dateString);
        return format(date, 'MMM dd, yyyy');
      } catch {
        return dateString;
      }
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusUpper = (status || 'PENDING').toUpperCase();
    switch (statusUpper) {
      case 'PAID':
        return (
          <Badge className="bg-success/10 text-success border-success/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/30">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-warning/10 text-warning border-warning/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (fees.length === 0) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <EmptyState
            icon={DollarSign}
            title="No Fees Recorded"
            description="No fee payments have been recorded yet. Fees will appear here once students make payments."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="text-white">Student</TableHead>
                <TableHead className="text-white">Amount</TableHead>
                <TableHead className="text-white">Purpose</TableHead>
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => {
                const student = fee.student || {};
                const amount = parseFloat(fee.amount || fee.feeAmount || '0') || 0;

                return (
                  <TableRow
                    key={fee.id}
                    className="border-primary/20 hover:bg-primary/10 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                          {(student.firstname?.[0] || '') + (student.lastname?.[0] || '')}
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {student.firstname} {student.lastname}
                          </div>
                          {student.email && (
                            <div className="text-xs text-muted-foreground">{student.email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-semibold">
                      {formatCurrency(amount)}
                    </TableCell>
                    <TableCell className="text-white">
                      {fee.purpose || 'N/A'}
                    </TableCell>
                    <TableCell className="text-white">
                      {formatDate(fee.paidAt || fee.createdAt || fee.date)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(fee.status)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeesTable;

