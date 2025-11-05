import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Loader2 } from 'lucide-react';
import { eventApi } from '@/lib/api';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { LocationPicker } from '@/components/LocationPicker';

interface EditEventDialogProps {
  event: any;
  clubs: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditEventDialog = ({ event, clubs, isOpen, onClose, onSuccess }: EditEventDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    latitude: '',
    longitude: '',
    clubId: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (event && isOpen) {
      // Format dates for input fields
      let startAt = '';
      let endAt = '';
      
      if (event.startAt) {
        try {
          const startDate = new Date(event.startAt);
          startAt = format(startDate, "yyyy-MM-dd'T'HH:mm");
        } catch {
          startAt = event.startAt;
        }
      }
      
      if (event.endAt) {
        try {
          const endDate = new Date(event.endAt);
          endAt = format(endDate, "yyyy-MM-dd'T'HH:mm");
        } catch {
          endAt = event.endAt;
        }
      }

      setFormData({
        title: event.title || '',
        description: event.description || '',
        startAt: startAt,
        endAt: endAt,
        latitude: event.latitude?.toString() || '',
        longitude: event.longitude?.toString() || '',
        clubId: event.club?.id?.toString() || event.clubId?.toString() || '',
      });
    }
  }, [event, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event?.id) return;

    if (!formData.title || formData.title.length < 3) {
      toast.error('Event title must be at least 3 characters');
      return;
    }

    if (!formData.startAt) {
      toast.error('Start date/time is required');
      return;
    }

    if (!formData.clubId) {
      toast.error('Please select a club');
      return;
    }

    setIsLoading(true);
    try {
      await eventApi.update(event.id, {
        title: formData.title,
        description: formData.description || undefined,
        startAt: formData.startAt,
        endAt: formData.endAt || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        clubId: parseInt(formData.clubId),
      });
      toast.success('Event updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Edit Event
          </DialogTitle>
          <DialogDescription>
            Update event information and details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter event title"
              required
              minLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter event description"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startAt">Start Date & Time *</Label>
              <Input
                id="startAt"
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endAt">End Date & Time</Label>
              <Input
                id="endAt"
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clubId">Club *</Label>
            <Select
              value={formData.clubId}
              onValueChange={(value) => setFormData({ ...formData, clubId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a club" />
              </SelectTrigger>
              <SelectContent>
                {clubs.map((club) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.title || club.name || `Club ${club.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location (Optional)</Label>
            <LocationPicker
              latitude={formData.latitude ? parseFloat(formData.latitude) : undefined}
              longitude={formData.longitude ? parseFloat(formData.longitude) : undefined}
              onLocationChange={(lat, lng) => {
                setFormData({
                  ...formData,
                  latitude: lat?.toString() || '',
                  longitude: lng?.toString() || '',
                });
              }}
            />
          </div>

          <div className="flex gap-3 pt-4">
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
              type="submit"
              className="flex-1 bg-gradient-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Update Event
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventDialog;

