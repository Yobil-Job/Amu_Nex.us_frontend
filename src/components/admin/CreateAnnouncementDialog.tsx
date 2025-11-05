import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Globe } from 'lucide-react';
import { announcementApi } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface CreateAnnouncementDialogProps {
  clubs: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAnnouncementDialog = ({ clubs, isOpen, onClose, onSuccess }: CreateAnnouncementDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clubId: 'system', // Default to system-wide
    isSystemWide: true,
  });
  const [selectedClubIds, setSelectedClubIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || formData.title.length < 3) {
      toast.error('Announcement title must be at least 3 characters');
      return;
    }

    setIsLoading(true);
    try {
      // If system-wide, create for all clubs (backend will handle this)
      // If specific clubs, create for each selected club
      if (formData.isSystemWide) {
        // Create system-wide announcement (no clubId or null clubId)
        await announcementApi.create({
          title: formData.title,
          description: formData.description || undefined,
          // No clubId for system-wide
        });
      } else if (selectedClubIds.length > 0) {
        // Create for multiple clubs
        await Promise.all(
          selectedClubIds.map((clubId) =>
            announcementApi.create({
              title: formData.title,
              description: formData.description || undefined,
              clubId: clubId,
            })
          )
        );
      } else if (formData.clubId && formData.clubId !== 'system') {
        // Create for single club
        await announcementApi.create({
          title: formData.title,
          description: formData.description || undefined,
          clubId: parseInt(formData.clubId),
        });
      } else {
        toast.error('Please select at least one club or system-wide');
        return;
      }

      toast.success('Announcement created successfully');
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        title: '',
        description: '',
        clubId: 'system',
        isSystemWide: true,
      });
      setSelectedClubIds([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create announcement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        title: '',
        description: '',
        clubId: 'system',
        isSystemWide: true,
      });
      setSelectedClubIds([]);
      onClose();
    }
  };

  const toggleClubSelection = (clubId: number) => {
    if (selectedClubIds.includes(clubId)) {
      setSelectedClubIds(selectedClubIds.filter((id) => id !== clubId));
    } else {
      setSelectedClubIds([...selectedClubIds, clubId]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create Announcement
          </DialogTitle>
          <DialogDescription>
            Create a new announcement for all clubs or specific clubs
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Announcement Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter announcement title"
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
              placeholder="Enter announcement description"
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label>Target Audience</Label>
            
            {/* System-Wide Option */}
            <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary/20">
              <Checkbox
                id="systemWide"
                checked={formData.isSystemWide}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, isSystemWide: checked as boolean, clubId: 'system' });
                  setSelectedClubIds([]);
                }}
              />
              <Label htmlFor="systemWide" className="flex items-center gap-2 cursor-pointer flex-1">
                <Globe className="h-4 w-4 text-accent" />
                <span>System-Wide (All Clubs)</span>
              </Label>
            </div>

            {/* Specific Club Option */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary/20">
                <Checkbox
                  id="specificClubs"
                  checked={!formData.isSystemWide}
                  onCheckedChange={(checked) => {
                    setFormData({ ...formData, isSystemWide: !checked });
                    if (checked) {
                      setSelectedClubIds([]);
                    }
                  }}
                />
                <Label htmlFor="specificClubs" className="cursor-pointer">
                  Specific Clubs
                </Label>
              </div>

              {!formData.isSystemWide && (
                <div className="ml-6 space-y-2 max-h-48 overflow-y-auto border border-primary/20 rounded-lg p-3">
                  {clubs.map((club) => (
                    <div key={club.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`club-${club.id}`}
                        checked={selectedClubIds.includes(club.id)}
                        onCheckedChange={() => toggleClubSelection(club.id)}
                      />
                      <Label htmlFor={`club-${club.id}`} className="cursor-pointer flex-1">
                        {club.title || club.name || `Club ${club.id}`}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary"
              disabled={isLoading || (!formData.isSystemWide && selectedClubIds.length === 0)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Announcement
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAnnouncementDialog;

