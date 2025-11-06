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
import { AlertTriangle, Loader2, Calendar, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { eventApi } from '@/lib/api';
import { format, parseISO } from 'date-fns';

interface DeleteEventDialogProps {
  event: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteEventDialog = ({ event, isOpen, onClose, onSuccess }: DeleteEventDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!event?.id) return;

    setIsDeleting(true);
    try {
      await eventApi.delete(event.id);
      toast.success('Event deleted successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete event');
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

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Event
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to delete this event? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="glass-card p-4 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-white mb-1">
                  {event.title || 'Untitled Event'}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {event.description || 'No description'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Start: {formatDate(event.startAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>End: {formatDate(event.endAt)}</span>
              </div>
              {event.latitude && event.longitude && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Location: {parseFloat(event.latitude).toFixed(4)}, {parseFloat(event.longitude).toFixed(4)}</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            All event information, including participation records, will be permanently deleted.
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
                Delete Event
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteEventDialog;

