import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Trash2, Building2 } from 'lucide-react';
import { clubApi } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';

interface DeleteClubDialogProps {
  club: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteClubDialog = ({ club, isOpen, onClose, onSuccess }: DeleteClubDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const clubName = club?.title || club?.name || 'this club';
  const requiresConfirm = confirmText.toLowerCase() === 'delete';

  const handleDelete = async () => {
    if (!club?.id) return;
    if (!requiresConfirm) {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setIsLoading(true);
    try {
      await clubApi.delete(club.id);
      toast.success('Club deleted successfully');
      onSuccess();
      onClose();
      setConfirmText('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete club');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Club
          </DialogTitle>
          <DialogDescription className="text-base">
            This action cannot be undone. This will permanently delete the club and all its data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="glass-card p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-1">Warning</p>
                <p className="text-xs text-muted-foreground">
                  Deleting <span className="font-semibold text-white">{clubName}</span> will:
                </p>
                <ul className="list-disc list-inside text-xs text-muted-foreground mt-2 space-y-1">
                  <li>Remove the club permanently</li>
                  <li>Remove all club memberships</li>
                  <li>Remove all club events</li>
                  <li>Remove all club announcements</li>
                  <li>This action is permanent</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Type <span className="font-mono text-destructive">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-3 py-2 bg-background border border-primary/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
              disabled={isLoading || !requiresConfirm}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Club
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteClubDialog;

