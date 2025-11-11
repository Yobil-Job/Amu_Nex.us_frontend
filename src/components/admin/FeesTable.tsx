import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Building2, User, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

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
        <CardContent className="p-12">
          <div className="text-center">
            <DollarSign className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg">No fees found</p>
            <p className="text-muted-foreground text-sm mt-2">
              Try adjusting your filters
            </p>
          </div>
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
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => {
                // Extract student data - check multiple possible locations
                const student = fee.student || {};
                const studentName = student.firstname || student.firstName || '';
                const studentLastName = student.lastname || student.lastName || '';
                const studentEmail = student.email || '';
                const displayName = `${studentName} ${studentLastName}`.trim() || 'Unknown Student';
                const initials = (studentName?.[0] || '') + (studentLastName?.[0] || '') || '?';

                // Extract club data - check multiple possible locations
                const club = fee.club || {};
                const clubName = club.title || club.name || `Club ${club.id || fee.clubId || 'N/A'}`;

                // Extract amount from multiple possible locations
                const amount = parseFloat(fee.amount || fee.feeAmount || fee.fee || '0') || 0;

                return (
                  <TableRow key={fee.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {initials}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {displayName}
                          </div>
                          {studentEmail && (
                            <div className="text-xs text-muted-foreground">{studentEmail}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-accent" />
                        <span className="text-white">
                          {clubName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="font-semibold text-white">{formatCurrency(amount)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {fee.purpose || fee.description || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(fee.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(
                          fee.paymentDate || fee.payment_date ||
                          fee.createdAt || fee.created_at ||
                          fee.date || fee.paidDate || fee.paid_date
                        )}
                      </div>
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

