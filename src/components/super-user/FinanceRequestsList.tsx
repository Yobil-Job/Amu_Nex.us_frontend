import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, DollarSign, User, FileText, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/admin/EmptyState';
import { toast } from 'sonner';

interface FinanceRequestsListProps {
  requests: any[];
  isLoading: boolean;
  onApprove: (request: any) => void;
  onReject: (request: any) => void;
}

// Mock finance requests stored in localStorage (client-side only)
const STORAGE_KEY = 'finance_requests';

// Load finance requests from localStorage (mock)
export const loadFinanceRequests = (clubId: number): any[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const allRequests = JSON.parse(stored);
    return allRequests.filter((r: any) => r.clubId === clubId && r.status === 'PENDING');
  } catch {
    return [];
  }
};

// Save finance request to localStorage (mock)
export const saveFinanceRequest = (request: any) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allRequests = stored ? JSON.parse(stored) : [];
    allRequests.push({
      ...request,
      id: Date.now(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRequests));
  } catch (error) {
    console.error('Failed to save finance request:', error);
  }
};

// Update finance request status (mock)
export const updateFinanceRequestStatus = (requestId: number, status: 'APPROVED' | 'REJECTED', reason?: string) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const allRequests = JSON.parse(stored);
    const updated = allRequests.map((r: any) =>
      r.id === requestId
        ? { ...r, status, reason, updatedAt: new Date().toISOString() }
        : r
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update finance request:', error);
  }
};

const FinanceRequestsList = ({ requests, isLoading, onApprove, onReject }: FinanceRequestsListProps) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <EmptyState
            icon={DollarSign}
            title="No Finance Requests"
            description="No pending finance requests from club members."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          Pending Finance Requests ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="glass-card p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${request.type === 'expense' ? 'bg-destructive/10' : 'bg-success/10'}`}>
                      <DollarSign className={`h-5 w-5 ${request.type === 'expense' ? 'text-destructive' : 'text-success'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-white">
                          {request.title || `${request.type === 'expense' ? 'Expense' : 'Income'} Request`}
                        </h3>
                        <Badge variant="outline" className="text-xs border-accent/30 text-accent">
                          {request.type === 'expense' ? 'Expense' : 'Income'}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-warning/30 text-warning">
                          {formatCurrency(request.amount)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Requested by: {request.requestedBy?.name || request.requestedByName || 'Club Member'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {request.description || 'No description provided'}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Requested: {formatDate(request.createdAt)}</span>
                        </div>
                        {request.category && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>Category: {request.category}</span>
                          </div>
                        )}
                      </div>
                      
                      {request.reason && (
                        <div className="glass-card p-3 rounded border border-primary/10 mb-3">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Request Reason:</p>
                          <p className="text-sm text-white">{request.reason}</p>
                        </div>
                      )}
                      
                      {request.receiptNumber && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>Receipt: {request.receiptNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => onApprove(request)}
                    className="gap-2 bg-success hover:bg-success/90"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReject(request)}
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinanceRequestsList;

