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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authorityApi, clubApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';

interface CreateAuthorityDialogProps {
  clubId: number;
  clubAdminId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAuthorityDialog = ({ clubId, clubAdminId, isOpen, onClose, onSuccess }: CreateAuthorityDialogProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    studentId: '',
  });

  useEffect(() => {
    if (isOpen && clubId) {
      loadMembers();
    }
  }, [isOpen, clubId]);

  const loadMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const membersRes = await clubApi.getMembers(clubId).catch(() => ({ _embedded: { studentResponseDtoList: [] } }));
      const membersList = extractCollection<any>(membersRes) || [];
      setMembers(membersList);
    } catch (error: any) {
      toast.error('Failed to load club members');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleCreate = async () => {
    // Validate required fields
    if (!formData.name || !formData.startDate || !formData.endDate || !formData.studentId) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate name length (backend: min 3, max 50)
    if (formData.name.length < 3 || formData.name.length > 50) {
      toast.error('Role name must be between 3 and 50 characters');
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.error('Invalid date format');
      return;
    }

    if (startDate >= endDate) {
      toast.error('End date must be after start date');
      return;
    }

    setIsCreating(true);
    try {
      await authorityApi.create(clubAdminId, {
        name: formData.name,
        startDate: formData.startDate, // Already in YYYY-MM-DD format
        endDate: formData.endDate,     // Already in YYYY-MM-DD format
        clubId: clubId,
        studentId: parseInt(formData.studentId),
      });

      toast.success('Authority created successfully');
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create authority');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      studentId: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Common authority roles
  const commonRoles = [
    'President',
    'Vice President',
    'Secretary',
    'Treasurer',
    'Public Relations Officer',
    'Event Coordinator',
    'Member',
    'ADMIN',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-primary/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Create Authority
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Assign a leadership role to a club member
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Role Name <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.name}
              onValueChange={(value) => setFormData({ ...formData, name: value })}
            >
              <SelectTrigger className="glass-card border-primary/20">
                <SelectValue placeholder="Select or type role name" />
              </SelectTrigger>
              <SelectContent className="glass-card border-primary/20">
                {commonRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="name"
              placeholder="Or type custom role name (3-50 characters)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-2 glass-card border-primary/20"
            />
            <p className="text-xs text-muted-foreground">
              Select from common roles or type a custom role name
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentId" className="text-white">
              Member <span className="text-destructive">*</span>
            </Label>
            {isLoadingMembers ? (
              <div className="h-10 w-full bg-muted/10 rounded-md animate-pulse" />
            ) : (
              <Select
                value={formData.studentId}
                onValueChange={(value) => setFormData({ ...formData, studentId: value })}
              >
                <SelectTrigger className="glass-card border-primary/20">
                  <SelectValue placeholder="Select a club member" />
                </SelectTrigger>
                <SelectContent className="glass-card border-primary/20 max-h-[200px]">
                  {members.length === 0 ? (
                    <SelectItem value="" disabled>No members available</SelectItem>
                  ) : (
                    members.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.firstname} {member.lastname} {member.email ? `(${member.email})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-white">
                Start Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="glass-card border-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-white">
                End Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="glass-card border-primary/20"
                min={formData.startDate || undefined}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleCreate}
            disabled={isCreating || !formData.name || !formData.startDate || !formData.endDate || !formData.studentId}
            className="gap-2 purple-gold-gradient"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Create Authority
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAuthorityDialog;

