import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Loader2 } from 'lucide-react';
import { clubApi } from '@/lib/api';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface EditClubDialogProps {
  club: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditClubDialog = ({ club, isOpen, onClose, onSuccess }: EditClubDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    club_Type: '',
    description: '',
    logo: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (club && isOpen) {
      setFormData({
        title: club.title || club.name || '',
        club_Type: club.club_Type || '',
        description: club.description || '',
        logo: club.logo || '',
      });
    }
  }, [club, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club?.id) return;

    if (!formData.title || formData.title.length < 3) {
      toast.error('Club title must be at least 3 characters');
      return;
    }

    setIsLoading(true);
    try {
      await clubApi.update(club.id, {
        title: formData.title,
        club_Type: formData.club_Type || undefined,
        description: formData.description || undefined,
        logo: formData.logo || undefined,
      });
      toast.success('Club updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update club');
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
            Edit Club
          </DialogTitle>
          <DialogDescription>
            Update club information and details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Club Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter club title"
              required
              minLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="club_Type">Club Type</Label>
            <Select
              value={formData.club_Type}
              onValueChange={(value) => setFormData({ ...formData, club_Type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select club type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Cultural">Cultural</SelectItem>
                <SelectItem value="Social">Social</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Arts">Arts</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter club description"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL (Optional)</Label>
            <Input
              id="logo"
              type="url"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
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
                  Update Club
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClubDialog;

