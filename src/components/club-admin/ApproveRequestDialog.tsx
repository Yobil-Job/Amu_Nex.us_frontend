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
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { clubApi } from '@/lib/api';

interface ApproveRequestDialogProps {
  request: any | null;
  clubId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ApproveRequestDialog = ({ request, clubId, isOpen, onClose, onSuccess }: ApproveRequestDialogProps) => {
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    if (!request?.studentId && !request?.student?.id) return;

    setIsApproving(true);
    try {
      const studentId = request.studentId || request.student?.id;
      await clubApi.approveRequest(clubId, studentId);
      toast.success('Join request approved successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve request');
    } finally {
      setIsApproving(false);
    }
  };

  if (!request) return null;

  const student = request.student || request;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Approve Join Request
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to approve this join request?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
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
          <p className="text-sm text-muted-foreground mt-4">
            This will approve the student's request to join the club. They will become a member and have access to club events, announcements, and other resources.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isApproving}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleApprove}
            disabled={isApproving}
            className="gap-2 bg-success hover:bg-success/90"
          >
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Approve Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveRequestDialog;

