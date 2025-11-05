import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Trash2, Calendar } from 'lucide-react';
import { eventApi } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';

interface DeleteEventDialogProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteEventDialog = ({ event, isOpen, onClose, onSuccess }: DeleteEventDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const eventName = event?.title || 'this event';
  const requiresConfirm = confirmText.toLowerCase() === 'delete';

  const handleDelete = async () => {
    if (!event?.id) return;
    if (!requiresConfirm) {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setIsLoading(true);
    try {
      await eventApi.delete(event.id);
      toast.success('Event deleted successfully');
      onSuccess();
      onClose();
      setConfirmText('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete event');
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
            Delete Event
          </DialogTitle>
          <DialogDescription className="text-base">
            This action cannot be undone. This will permanently delete the event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="glass-card p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-1">Warning</p>
                <p className="text-xs text-muted-foreground">
                  Deleting <span className="font-semibold text-white">{eventName}</span> will:
                </p>
                <ul className="list-disc list-inside text-xs text-muted-foreground mt-2 space-y-1">
                  <li>Remove the event permanently</li>
                  <li>Remove all event registrations</li>
                  <li>Remove event from calendar</li>
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
                  Delete Event
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteEventDialog;

