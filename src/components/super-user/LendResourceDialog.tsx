import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRightLeft, Loader2, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LendResourceDialogProps {
  resource: any | null;
  members: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Update resource lending status
export const lendResource = (resourceId: number, memberId: number, memberName: string, expectedReturnDate?: string, notes?: string) => {
  try {
    const stored = localStorage.getItem('club_resources');
    if (!stored) return;
    const allResources = JSON.parse(stored);
    const updated = allResources.map((r: any) =>
      r.id === resourceId
        ? {
            ...r,
            lentTo: memberName,
            lentToId: memberId,
            lentDate: new Date().toISOString(),
            expectedReturnDate: expectedReturnDate || null,
            lendingNotes: notes || null,
            status: 'LENT',
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
      action: 'LENT',
      memberId,
      memberName,
      date: new Date().toISOString(),
      expectedReturnDate: expectedReturnDate || null,
      notes: notes || null,
    });
    localStorage.setItem('resource_history', JSON.stringify(history));
  } catch (error) {
    console.error('Failed to lend resource:', error);
  }
};

const LendResourceDialog = ({ resource, members, isOpen, onClose, onSuccess }: LendResourceDialogProps) => {
  const [isLending, setIsLending] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    expectedReturnDate: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      memberId: '',
      expectedReturnDate: '',
      notes: '',
    });
  };

  const handleLend = async () => {
    if (!resource?.id || !formData.memberId) {
      toast.error('Please select a member to lend the resource to');
      return;
    }

    const selectedMember = members.find((m) => m.id.toString() === formData.memberId);
    if (!selectedMember) {
      toast.error('Selected member not found');
      return;
    }

    setIsLending(true);
    try {
      lendResource(
        resource.id,
        selectedMember.id,
        `${selectedMember.firstname} ${selectedMember.lastname}`,
        formData.expectedReturnDate || undefined,
        formData.notes || undefined
      );

      toast.success('Resource lent successfully');
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to lend resource');
    } finally {
      setIsLending(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!resource) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Lend Resource
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Lend "{resource.name}" to a club member
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Resource Info */}
          <div className="glass-card p-4 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <ArrowRightLeft className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white mb-1">
                  {resource.name || 'Unnamed Resource'}
                </h3>
                <p className="text-sm text-muted-foreground">{resource.description || 'No description'}</p>
                {resource.location && (
                  <p className="text-xs text-muted-foreground mt-1">Location: {resource.location}</p>
                )}
              </div>
            </div>
          </div>

          {/* Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="memberId" className="text-white flex items-center gap-2">
              <User className="h-4 w-4" />
              Lend To Member <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.memberId} onValueChange={(value) => setFormData({ ...formData, memberId: value })}>
              <SelectTrigger id="memberId" className="glass-card border-primary/20">
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {members.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No members available</div>
                ) : (
                  members.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.firstname} {member.lastname} ({member.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Expected Return Date */}
          <div className="space-y-2">
            <Label htmlFor="expectedReturnDate" className="text-white flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expected Return Date (Optional)
            </Label>
            <Input
              id="expectedReturnDate"
              type="date"
              value={formData.expectedReturnDate}
              onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="glass-card border-primary/20"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about the lending..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="glass-card border-primary/20 min-h-[80px]"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLending}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleLend}
            disabled={isLending || !formData.memberId}
            className="gap-2"
          >
            {isLending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Lending...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4 w-4" />
                Lend Resource
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LendResourceDialog;

