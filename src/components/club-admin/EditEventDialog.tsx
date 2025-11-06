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
import { Pencil, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { eventApi } from '@/lib/api';
import { LocationPicker } from '@/components/LocationPicker';

interface EditEventDialogProps {
  event: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditEventDialog = ({ event, isOpen, onClose, onSuccess }: EditEventDialogProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    if (event && isOpen) {
      // Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:mm)
      const formatForInput = (isoString: string) => {
        if (!isoString) return '';
        try {
          const date = new Date(isoString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch {
          return '';
        }
      };

      setFormData({
        title: event.title || '',
        description: event.description || '',
        startAt: formatForInput(event.startAt),
        endAt: formatForInput(event.endAt),
        latitude: event.latitude?.toString() || '',
        longitude: event.longitude?.toString() || '',
      });
    }
  }, [event, isOpen]);

  const convertToISO = (dateTimeLocal: string): string | null => {
    if (!dateTimeLocal) return null;
    try {
      const date = new Date(dateTimeLocal);
      return date.toISOString();
    } catch {
      return null;
    }
  };

  const handleUpdate = async () => {
    if (!event?.id) return;

    // Validate required fields
    if (!formData.title || !formData.description || !formData.startAt || !formData.endAt) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate title length (backend: min 10, max 100)
    if (formData.title.length < 10 || formData.title.length > 100) {
      toast.error('Title must be between 10 and 100 characters');
      return;
    }

    // Validate description length (backend: min 10, max 1000)
    if (formData.description.length < 10 || formData.description.length > 1000) {
      toast.error('Description must be between 10 and 1000 characters');
      return;
    }

    const startAtISO = convertToISO(formData.startAt);
    const endAtISO = convertToISO(formData.endAt);

    if (!startAtISO || !endAtISO) {
      toast.error('Invalid date/time format');
      return;
    }

    if (new Date(startAtISO) >= new Date(endAtISO)) {
      toast.error('End time must be after start time');
      return;
    }

    setIsUpdating(true);
    try {
      await eventApi.update(event.id, {
        title: formData.title,
        description: formData.description,
        startAt: startAtISO,
        endAt: endAtISO,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      });

      toast.success('Event updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update event');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData({
      ...formData,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    });
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      startAt: '',
      endAt: '',
      latitude: '',
      longitude: '',
    });
    onClose();
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-primary/20 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <Pencil className="h-5 w-5 text-accent" />
            Edit Event
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update event details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-white">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              placeholder="Enter event title (10-100 characters)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="glass-card border-primary/20"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/100 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-white">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="edit-description"
              placeholder="Enter event description (10-1000 characters)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="glass-card border-primary/20 min-h-[100px]"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/1000 characters
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-startAt" className="text-white">
                Start Date & Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-startAt"
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                className="glass-card border-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-endAt" className="text-white">
                End Date & Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-endAt"
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                className="glass-card border-primary/20"
                min={formData.startAt || undefined}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location (Optional)
            </Label>
            <LocationPicker
              onLocationChange={handleLocationChange}
              initialLat={formData.latitude ? parseFloat(formData.latitude) : undefined}
              initialLng={formData.longitude ? parseFloat(formData.longitude) : undefined}
            />
            {formData.latitude && formData.longitude && (
              <p className="text-xs text-muted-foreground">
                Location set: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleUpdate}
            disabled={isUpdating || !formData.title || !formData.description || !formData.startAt || !formData.endAt}
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
                Update Event
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventDialog;

