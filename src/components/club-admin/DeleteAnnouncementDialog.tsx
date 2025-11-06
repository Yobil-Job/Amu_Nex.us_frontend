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
import { AlertTriangle, Loader2, Bell, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { announcementApi } from '@/lib/api';
import { format, parseISO } from 'date-fns';

interface DeleteAnnouncementDialogProps {
  announcement: any | null;
  createdById: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteAnnouncementDialog = ({ announcement, createdById, isOpen, onClose, onSuccess }: DeleteAnnouncementDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!announcement?.id) return;

    setIsDeleting(true);
    try {
      await announcementApi.delete(announcement.id, createdById);
      toast.success('Announcement deleted successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete announcement');
    } finally {
      setIsDeleting(false);
    }
  };

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

  if (!announcement) return null;

  const creator = announcement.createdBy || announcement.creator || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Announcement
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to delete this announcement? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="glass-card p-4 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Bell className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-white mb-1">
                  {announcement.title || 'Untitled Announcement'}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {announcement.description || 'No description'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Created: {formatDate(announcement.createdAt)}</span>
              </div>
              {creator.firstname && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>
                    By: {creator.firstname} {creator.lastname}
                  </span>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            This announcement will be permanently deleted and will no longer be visible to club members.
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
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Delete Announcement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAnnouncementDialog;

