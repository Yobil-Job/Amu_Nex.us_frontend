import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Trash2, Bell } from 'lucide-react';
import { announcementApi } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface DeleteAnnouncementDialogProps {
  announcement: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteAnnouncementDialog = ({ announcement, isOpen, onClose, onSuccess }: DeleteAnnouncementDialogProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const announcementTitle = announcement?.title || 'this announcement';
  const requiresConfirm = confirmText.toLowerCase() === 'delete';

  const handleDelete = async () => {
    if (!announcement?.id || !user?.id) return;
    if (!requiresConfirm) {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setIsLoading(true);
    try {
      await announcementApi.delete(announcement.id, user.id);
      toast.success('Announcement deleted successfully');
      onSuccess();
      onClose();
      setConfirmText('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete announcement');
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
            Delete Announcement
          </DialogTitle>
          <DialogDescription className="text-base">
            This action cannot be undone. This will permanently delete the announcement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="glass-card p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-1">Warning</p>
                <p className="text-xs text-muted-foreground">
                  Deleting <span className="font-semibold text-white">{announcementTitle}</span> will:
                </p>
                <ul className="list-disc list-inside text-xs text-muted-foreground mt-2 space-y-1">
                  <li>Remove the announcement permanently</li>
                  <li>Remove from all club feeds</li>
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
                  Delete Announcement
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAnnouncementDialog;

