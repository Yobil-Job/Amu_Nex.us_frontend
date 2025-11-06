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
import { Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { announcementApi } from '@/lib/api';

interface EditAnnouncementDialogProps {
  announcement: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditAnnouncementDialog = ({ announcement, isOpen, onClose, onSuccess }: EditAnnouncementDialogProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    if (announcement && isOpen) {
      setFormData({
        title: announcement.title || '',
        description: announcement.description || '',
      });
    }
  }, [announcement, isOpen]);

  const handleUpdate = async () => {
    if (!announcement?.id) return;

    // Validate required fields
    if (!formData.title || formData.title.trim().length < 3) {
      toast.error('Announcement title must be at least 3 characters');
      return;
    }

    setIsUpdating(true);
    try {
      await announcementApi.update(announcement.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
      });

      toast.success('Announcement updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update announcement');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
    });
    onClose();
  };

  if (!announcement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-primary/20 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <Pencil className="h-5 w-5 text-accent" />
            Edit Announcement
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update announcement details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-white">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              placeholder="Enter announcement title (min 3 characters)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="glass-card border-primary/20"
              minLength={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/200 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-white">
              Description
            </Label>
            <Textarea
              id="edit-description"
              placeholder="Enter announcement description (supports basic formatting)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="glass-card border-primary/20 min-h-[150px] font-mono text-sm"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/2000 characters
            </p>
            <p className="text-xs text-muted-foreground italic">
              Tip: You can use line breaks and basic formatting. Rich text editor coming soon!
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleUpdate}
            disabled={isUpdating || !formData.title || formData.title.trim().length < 3}
            className="gap-2 purple-gold-gradient"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                Update Announcement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAnnouncementDialog;

