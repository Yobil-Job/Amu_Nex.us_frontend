import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, DollarSign, Calendar, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface PaymentStatusCardProps {
  fee: {
    id: number;
    amount?: number;
    purpose?: string;
    status?: string;
    createdAt?: string;
    club?: {
      id: number;
      title?: string;
      name?: string;
    };
  };
}

// Helper function to extract status from multiple possible fields
const getFeeStatus = (fee: any): string | null => {
  return fee.status || fee.paymentStatus || fee.payment_status || null;
};

// Helper function to extract amount from multiple possible fields
const getFeeAmount = (fee: any): number => {
  return fee.amount || fee.feeAmount || fee.fee || fee.total || 0;
};

const PaymentStatusCard = ({ fee }: PaymentStatusCardProps) => {
  const status = getFeeStatus(fee);
  const amount = getFeeAmount(fee);

  const getStatusIcon = (status?: string | null) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status?: string | null) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return (
          <Badge className="bg-success/10 text-success border-success/30">
            Paid
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/30">
            Pending
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/30">
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Unknown
          </Badge>
        );
    }
  };

  const getStatusColor = (status?: string | null) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'border-l-success bg-success/5';
      case 'PENDING':
        return 'border-l-warning bg-warning/5';
      case 'FAILED':
        return 'border-l-destructive bg-destructive/5';
      default:
        return 'border-l-muted-foreground/30';
    }
  };

  // Helper function to extract date from multiple possible fields
  const getFeeDate = (fee: any): Date | null => {
    const dateStr = fee.createdAt || fee.created_at || fee.paymentDate || fee.payment_date || fee.date || fee.paidDate || fee.paid_date;
    if (!dateStr) return null;
    try {
      // Try parseISO first (for ISO strings)
      if (typeof dateStr === 'string') {
        try {
          const parsed = parseISO(dateStr);
          if (!isNaN(parsed.getTime())) return parsed;
        } catch {
          // Fallback to Date constructor
        }
      }
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  const feeDate = getFeeDate(fee);

  return (
    <Card className={`border-l-4 transition-all hover:shadow-md ${getStatusColor(status)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(status)}
              <CardTitle className="text-lg">
                {fee.purpose || fee.description || 'Fee Payment'}
              </CardTitle>
            </div>
            {fee.club && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {fee.club.title || fee.club.name || 'Unknown Club'}
                </span>
              </div>
            )}
          </div>
          {getStatusBadge(status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Amount</span>
          </div>
          <span className="text-xl font-semibold">
            ${amount.toFixed(2)}
          </span>
        </div>

        {feeDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Calendar className="h-3 w-3" />
            <span>
              {format(feeDate, 'MMM dd, yyyy HH:mm')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentStatusCard;
