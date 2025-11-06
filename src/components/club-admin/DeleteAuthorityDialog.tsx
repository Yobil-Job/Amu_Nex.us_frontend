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
import { AlertTriangle, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { authorityApi } from '@/lib/api';

interface DeleteAuthorityDialogProps {
  authority: any | null;
  clubId: number;
  clubAdminId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteAuthorityDialog = ({ authority, clubId, clubAdminId, isOpen, onClose, onSuccess }: DeleteAuthorityDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!authority?.id) return;

    setIsDeleting(true);
    try {
      await authorityApi.delete(authority.id, clubId, clubAdminId);
      toast.success('Authority removed successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove authority');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!authority) return null;

  const student = authority.student || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Remove Authority
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to remove this authority role?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="glass-card p-4 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
                {(student.firstname?.[0] || '') + (student.lastname?.[0] || '')}
              </div>
              <div>
                <p className="font-semibold text-white">
                  {student.firstname} {student.lastname}
                </p>
                {student.email && (
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm text-white font-medium">Role: {authority.name || 'N/A'}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            This action will remove the authority role from the member. They will no longer have the associated permissions and responsibilities.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Remove Authority
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAuthorityDialog;

