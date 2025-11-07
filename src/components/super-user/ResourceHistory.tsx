import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, ArrowRightLeft, ArrowLeft, Package } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/admin/EmptyState';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ResourceHistoryProps {
  resource: any | null;
  history: any[];
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

// Load resource history from localStorage
export const loadResourceHistory = (resourceId: number): any[] => {
  try {
    const stored = localStorage.getItem('resource_history');
    if (!stored) return [];
    const allHistory = JSON.parse(stored);
    return allHistory
      .filter((h: any) => h.resourceId === resourceId)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });
  } catch {
    return [];
  }
};

const ResourceHistory = ({ resource, history, isLoading, isOpen, onClose }: ResourceHistoryProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      try {
        const date = new Date(dateString);
        return format(date, 'MMM dd, yyyy HH:mm');
      } catch {
        return dateString;
      }
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LENT':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/30">
            <ArrowRightLeft className="h-3 w-3 mr-1" />
            Lent
          </Badge>
        );
      case 'RETURNED':
        return (
          <Badge className="bg-success/10 text-success border-success/30">
            <ArrowLeft className="h-3 w-3 mr-1" />
            Returned
          </Badge>
        );
      case 'CREATED':
        return (
          <Badge className="bg-primary/10 text-primary border-primary/30">
            <Package className="h-3 w-3 mr-1" />
            Created
          </Badge>
        );
      case 'UPDATED':
        return (
          <Badge className="bg-accent/10 text-accent border-accent/30">
            Updated
          </Badge>
        );
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const getConditionBadge = (condition?: string) => {
    if (!condition) return null;
    switch (condition) {
      case 'GOOD':
        return <Badge className="bg-success/10 text-success border-success/30">Good</Badge>;
      case 'NEEDS_MAINTENANCE':
        return <Badge className="bg-warning/10 text-warning border-warning/30">Needs Maintenance</Badge>;
      case 'DAMAGED':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/30">Damaged</Badge>;
      default:
        return <Badge variant="secondary">{condition}</Badge>;
    }
  };

  if (!resource) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/20 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Resource History
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Usage history for {resource.name || 'Resource'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No History"
              description="No usage history available for this resource."
            />
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <Card key={entry.id} className="glass-card border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getActionBadge(entry.action)}
                        <div>
                          <p className="font-semibold text-white">
                            {entry.action === 'LENT' && 'Lent to'}
                            {entry.action === 'RETURNED' && 'Returned by'}
                            {entry.action === 'CREATED' && 'Resource Created'}
                            {entry.action === 'UPDATED' && 'Resource Updated'}
                          </p>
                          {entry.memberName && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {entry.memberName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(entry.date)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {entry.condition && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Condition:</span>
                          {getConditionBadge(entry.condition)}
                        </div>
                      )}
                      {entry.expectedReturnDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Expected return: {formatDate(entry.expectedReturnDate)}</span>
                        </div>
                      )}
                      {entry.notes && (
                        <div className="glass-card p-2 rounded border border-primary/10 mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                          <p className="text-sm text-white">{entry.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceHistory;

