import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface AnnouncementSchedulingDialogProps {
  announcement: any;
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledAt: string) => void;
}

const AnnouncementSchedulingDialog = ({ announcement, isOpen, onClose, onSchedule }: AnnouncementSchedulingDialogProps) => {
  const [scheduledAt, setScheduledAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (announcement && isOpen) {
      if (announcement.scheduledAt) {
        try {
          const date = new Date(announcement.scheduledAt);
          setScheduledAt(format(date, "yyyy-MM-dd'T'HH:mm"));
        } catch {
          setScheduledAt('');
        }
      } else {
        setScheduledAt('');
      }
    }
  }, [announcement, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scheduledAt) {
      toast.error('Please select a scheduled date and time');
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    const now = new Date();

    if (scheduledDate <= now) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    setIsLoading(true);
    try {
      onSchedule(scheduledAt);
      toast.success('Announcement scheduled successfully');
      onClose();
      setScheduledAt('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule announcement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSchedule = () => {
    setScheduledAt('');
    onSchedule('');
    toast.success('Schedule removed');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Schedule Announcement
          </DialogTitle>
          <DialogDescription>
            Set when this announcement should be published
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Schedule Date & Time</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="pl-10"
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to publish immediately
            </p>
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
            {scheduledAt && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemoveSchedule}
                className="flex-1"
                disabled={isLoading}
              >
                Remove Schedule
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary"
              disabled={isLoading || !scheduledAt}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementSchedulingDialog;

