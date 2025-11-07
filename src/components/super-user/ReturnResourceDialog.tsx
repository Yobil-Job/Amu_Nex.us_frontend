import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Package, User, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface ReturnResourceDialogProps {
  resource: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Update resource return status
export const returnResource = (resourceId: number, condition: string, notes?: string) => {
  try {
    const stored = localStorage.getItem('club_resources');
    if (!stored) return;
    const allResources = JSON.parse(stored);
    const resource = allResources.find((r: any) => r.id === resourceId);
    
    if (!resource) return;

    const updated = allResources.map((r: any) =>
      r.id === resourceId
        ? {
            ...r,
            lentTo: null,
            lentToId: null,
            lentDate: null,
            expectedReturnDate: null,
            lendingNotes: null,
            status: condition === 'DAMAGED' ? 'MAINTENANCE' : 'AVAILABLE',
            lastReturnDate: new Date().toISOString(),
            lastReturnCondition: condition,
            lastReturnNotes: notes || null,
          }
        : r
    );
    localStorage.setItem('club_resources', JSON.stringify(updated));

    // Record in history
    const historyStored = localStorage.getItem('resource_history') || '[]';
    const history = JSON.parse(historyStored);
    history.push({
      id: Date.now(),
      resourceId,
      action: 'RETURNED',
      memberId: resource.lentToId,
      memberName: resource.lentTo,
      date: new Date().toISOString(),
      condition,
      notes: notes || null,
    });
    localStorage.setItem('resource_history', JSON.stringify(history));
  } catch (error) {
    console.error('Failed to return resource:', error);
  }
};

const ReturnResourceDialog = ({ resource, isOpen, onClose, onSuccess }: ReturnResourceDialogProps) => {
  const [isReturning, setIsReturning] = useState(false);
  const [condition, setCondition] = useState<'GOOD' | 'DAMAGED' | 'NEEDS_MAINTENANCE'>('GOOD');
  const [notes, setNotes] = useState('');

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

  const handleReturn = async () => {
    if (!resource?.id) return;

    setIsReturning(true);
    try {
      returnResource(resource.id, condition, notes);

      toast.success('Resource returned successfully');
      setCondition('GOOD');
      setNotes('');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to return resource');
    } finally {
      setIsReturning(false);
    }
  };

  const handleClose = () => {
    setCondition('GOOD');
    setNotes('');
    onClose();
  };

  if (!resource) return null;

  const isOverdue = resource.expectedReturnDate && new Date(resource.expectedReturnDate) < new Date();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <ArrowLeft className="h-5 w-5 text-success" />
            Return Resource
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Record the return of "{resource.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Resource Info */}
          <div className="glass-card p-4 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-white mb-1">
                  {resource.name || 'Unnamed Resource'}
                </h3>
                <p className="text-sm text-muted-foreground">{resource.description || 'No description'}</p>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Lent to: {resource.lentTo || 'N/A'}</span>
              </div>
              {resource.lentDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Lent on: {formatDate(resource.lentDate)}</span>
                </div>
              )}
              {resource.expectedReturnDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className={isOverdue ? 'text-destructive' : 'text-muted-foreground'}>
                    Expected return: {formatDate(resource.expectedReturnDate)}
                    {isOverdue && ' (Overdue)'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <Label className="text-white">Resource Condition <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={condition === 'GOOD' ? 'default' : 'outline'}
                onClick={() => setCondition('GOOD')}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Good
              </Button>
              <Button
                type="button"
                variant={condition === 'NEEDS_MAINTENANCE' ? 'default' : 'outline'}
                onClick={() => setCondition('NEEDS_MAINTENANCE')}
                className="gap-2"
              >
                Maintenance
              </Button>
              <Button
                type="button"
                variant={condition === 'DAMAGED' ? 'default' : 'outline'}
                onClick={() => setCondition('DAMAGED')}
                className="gap-2 text-destructive hover:text-destructive"
              >
                Damaged
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="returnNotes" className="text-white">
              Return Notes (Optional)
            </Label>
            <Textarea
              id="returnNotes"
              placeholder="Add any notes about the return condition or issues..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass-card border-primary/20 min-h-[80px]"
              rows={3}
            />
          </div>

          {condition !== 'GOOD' && (
            <div className="glass-card p-3 rounded border border-warning/30 bg-warning/5">
              <p className="text-sm text-warning">
                {condition === 'DAMAGED'
                  ? 'This resource will be marked as "Under Maintenance" after return.'
                  : 'This resource may require maintenance after return.'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isReturning}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleReturn}
            disabled={isReturning}
            className="gap-2 bg-success hover:bg-success/90"
          >
            {isReturning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Returning...
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4" />
                Return Resource
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnResourceDialog;

