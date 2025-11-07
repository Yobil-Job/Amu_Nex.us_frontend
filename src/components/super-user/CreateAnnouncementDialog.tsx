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
import { Bell, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { announcementApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface CreateAnnouncementDialogProps {
  clubId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAnnouncementDialog = ({ clubId, isOpen, onClose, onSuccess }: CreateAnnouncementDialogProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
    });
  };

  const handleSubmit = async () => {
    // Validate
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.title.length < 3 || formData.title.length > 50) {
      toast.error('Title must be between 3 and 50 characters');
      return;
    }

    if (formData.description.length < 3 || formData.description.length > 1000) {
      toast.error('Description must be between 3 and 1000 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await announcementApi.create({
        title: formData.title,
        description: formData.description,
        clubId: clubId,
      });

      toast.success('Announcement created successfully');
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-primary/20 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Create Announcement
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Send an update to all club members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter announcement title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="glass-card border-primary/20"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/50 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Write your announcement message..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="glass-card border-primary/20 min-h-[150px]"
              rows={6}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/1000 characters
            </p>
          </div>

          {user && (
            <div className="glass-card p-3 rounded border border-primary/10">
              <p className="text-xs text-muted-foreground">
                Creating as: {user.firstname} {user.lastname}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title || !formData.description}
            className="gap-2 purple-gold-gradient"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Create Announcement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAnnouncementDialog;

