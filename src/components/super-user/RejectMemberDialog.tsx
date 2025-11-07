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
import { XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { clubApi } from '@/lib/api';

interface RejectMemberDialogProps {
  request: any | null;
  clubId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RejectMemberDialog = ({ request, clubId, isOpen, onClose, onSuccess }: RejectMemberDialogProps) => {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleReject = async () => {
    if (!request?.studentId && !request?.student?.id) return;

    setIsRejecting(true);
    try {
      const studentId = request.studentId || request.student?.id;
      await clubApi.rejectRequest(clubId, studentId);
      toast.success('Join request rejected');
      setRejectionReason('');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleClose = () => {
    setRejectionReason('');
    onClose();
  };

  if (!request) return null;

  const student = request.student || request;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Reject Join Request
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to reject this join request?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="glass-card p-4 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
                {(student.firstname?.[0] || '') + (student.lastname?.[0] || '')}
              </div>
              <div>
                <p className="font-semibold text-white">
                  {student.firstname} {student.lastname}
                </p>
                <p className="text-sm text-muted-foreground">{student.email}</p>
                {student.department && (
                  <p className="text-xs text-muted-foreground mt-1">{student.department}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rejectionReason" className="text-white">
              Rejection Reason (Optional)
            </Label>
            <Textarea
              id="rejectionReason"
              placeholder="Provide a reason for rejection (optional)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="glass-card border-primary/20"
            />
            <p className="text-xs text-muted-foreground">
              This reason will be visible to the student (if backend supports it).
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            This will reject the student's request to join the club. They will not become a member.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isRejecting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isRejecting}
            className="gap-2"
          >
            {isRejecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Reject Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectMemberDialog;

