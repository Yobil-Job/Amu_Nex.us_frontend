import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BulkRequestActionsProps {
  selectedRequests: number[];
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

const BulkRequestActions = ({
  selectedRequests,
  onBulkApprove,
  onBulkReject,
  onClearSelection,
  isLoading,
}: BulkRequestActionsProps) => {
  if (selectedRequests.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card border-primary/20 bg-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-white">
              {selectedRequests.length} {selectedRequests.length === 1 ? 'request' : 'requests'} selected
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={isLoading}
            >
              Clear Selection
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkApprove}
              disabled={isLoading}
              className="text-success hover:text-success hover:bg-success/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve All
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkReject}
              disabled={isLoading}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject All
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkRequestActions;

