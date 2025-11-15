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
import { Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { announcementApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';

interface CreateAnnouncementDialogProps {
  clubId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAnnouncementDialog = ({ clubId, isOpen, onClose, onSuccess }: CreateAnnouncementDialogProps) => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleCreate = async () => {
    // Validate clubId
    if (!clubId || clubId === 0) {
      toast.error('No club selected. Please select a club first.');
      console.error('❌ [CreateAnnouncementDialog] Invalid clubId:', clubId);
      return;
    }

    // Validate required fields
    if (!formData.title || formData.title.trim().length < 3) {
      toast.error('Announcement title must be at least 3 characters');
      return;
    }

    // Validate user ID
    if (!user?.id) {
      toast.error('User information not available. Please log in again.');
      console.error('❌ [CreateAnnouncementDialog] User ID is missing');
      return;
    }

    setIsCreating(true);
    try {
      // Check if user has an authority for this club (backend requires authority to create announcements)
      // ADMIN users might not have an authority record, but they should still be able to create announcements
      // The backend should check for both authority OR club admin status, but currently only checks authority
      console.log('🔍 [CreateAnnouncementDialog] Checking if user has authority for club:', clubId);
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
        
        console.log('🔍 [CreateAnnouncementDialog] User has authority for club:', hasAuthority);
      } catch (authErr) {
        console.warn('⚠️ [CreateAnnouncementDialog] Failed to check authorities:', authErr);
      }

      // Note: Even if hasAuthority is false, we still try to create the announcement
      // The backend should allow ADMIN users (club admins) to create announcements even without an authority record
      // If the backend rejects it, it's a backend configuration issue that needs to be fixed
      
      console.log('🔍 [CreateAnnouncementDialog] Creating announcement with clubId:', clubId, 'createdById:', user.id, 'hasAuthority:', hasAuthority);
      await announcementApi.create({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        clubId: clubId,
        createdById: user.id, // Backend expects createdById for the Student who created the announcement
        createdBy: { id: user.id }, // Also include as object (backend might accept either)
      });

      console.log('✅ [CreateAnnouncementDialog] Announcement created successfully');
      toast.success('Announcement created successfully');
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ [CreateAnnouncementDialog] Failed to create announcement:', {
        error,
        message: error.message,
        status: error.status,
        clubId,
      });
      toast.error(error.message || 'Failed to create announcement');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
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
            <Bell className="h-5 w-5 text-primary" />
            Create Announcement
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new announcement for your club members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
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
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
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
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleCreate}
            disabled={isCreating || !formData.title || formData.title.trim().length < 3}
            className="gap-2 purple-gold-gradient"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
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

