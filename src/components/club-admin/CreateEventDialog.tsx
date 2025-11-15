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
import { Calendar, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { eventApi } from '@/lib/api';
import { LocationPicker } from '@/components/LocationPicker';
import { useAuth } from '@/contexts/AuthContext';
import { authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';

interface CreateEventDialogProps {
  clubId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateEventDialog = ({ clubId, isOpen, onClose, onSuccess }: CreateEventDialogProps) => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const convertToISO = (dateTimeLocal: string): string | null => {
    if (!dateTimeLocal) return null;
    try {
      const date = new Date(dateTimeLocal);
      return date.toISOString();
    } catch {
      return null;
    }
  };

  const handleCreate = async () => {
    // Validate clubId
    if (!clubId || clubId === 0) {
      toast.error('No club selected. Please select a club first.');
      console.error('❌ [CreateEventDialog] Invalid clubId:', clubId);
      return;
    }

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

    // Validate user ID
    if (!user?.id) {
      toast.error('User information not available. Please log in again.');
      console.error('❌ [CreateEventDialog] User ID is missing');
      return;
    }

    setIsCreating(true);
    try {
      // Check if user has an authority for this club (backend requires authority to create events)
      // ADMIN users might not have an authority record, but they should still be able to create events
      // The backend should check for both authority OR club admin status, but currently only checks authority
      console.log('🔍 [CreateEventDialog] Checking if user has authority for club:', clubId);
      let hasAuthority = false;
      try {
        const authoritiesRes = await authorityApi.getByStudent(user.id).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
        const userAuthorities = extractCollection<any>(authoritiesRes) || [];
        
        // Check if user has an authority for this club
        hasAuthority = userAuthorities.some((auth: any) => {
          // Try to get club ID from HATEOAS link
          let authClubId: number | null = null;
          const clubLink = auth._links?.club?.href;
          if (clubLink) {
            const match = clubLink.match(/\/clubs\/(\d+)/);
            if (match && match[1]) {
              authClubId = Number(match[1]);
            }
          }
          // Fallback to direct field
          if (!authClubId) {
            authClubId = auth.club?.id || auth.clubId || auth.club?.clubId || null;
          }
          
          return authClubId != null && Number(authClubId) === Number(clubId);
        });
        
        console.log('🔍 [CreateEventDialog] User has authority for club:', hasAuthority);
      } catch (authErr) {
        console.warn('⚠️ [CreateEventDialog] Failed to check authorities:', authErr);
      }

      // Note: Even if hasAuthority is false, we still try to create the event
      // The backend should allow ADMIN users (club admins) to create events even without an authority record
      // If the backend rejects it, it's a backend configuration issue that needs to be fixed
      
      console.log('🔍 [CreateEventDialog] Creating event with clubId:', clubId, 'createdById:', user.id, 'hasAuthority:', hasAuthority);
      await eventApi.create({
        title: formData.title,
        description: formData.description,
        startAt: startAtISO,
        endAt: endAtISO,
        clubId: clubId,
        createdById: user.id, // Backend expects createdById for the Student who created the event
        createdBy: { id: user.id }, // Also include as object (backend might accept either)
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      });

      console.log('✅ [CreateEventDialog] Event created successfully');
      toast.success('Event created successfully');
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ [CreateEventDialog] Failed to create event:', {
        error,
        message: error.message,
        status: error.status,
        clubId,
      });
      toast.error(error.message || 'Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData({
      ...formData,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startAt: '',
      endAt: '',
      latitude: '',
      longitude: '',
    });
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
            <Calendar className="h-5 w-5 text-primary" />
            Create Event
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new event for your club
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
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
            <Label htmlFor="description" className="text-white">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
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
              <Label htmlFor="startAt" className="text-white">
                Start Date & Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startAt"
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                className="glass-card border-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endAt" className="text-white">
                End Date & Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endAt"
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
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleCreate}
            disabled={isCreating || !formData.title || !formData.description || !formData.startAt || !formData.endAt}
            className="gap-2 purple-gold-gradient"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                Create Event
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;

