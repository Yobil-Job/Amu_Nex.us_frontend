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
import { Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authorityApi } from '@/lib/api';

interface EditAuthorityDialogProps {
  authority: any | null;
  clubAdminId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditAuthorityDialog = ({ authority, clubAdminId, isOpen, onClose, onSuccess }: EditAuthorityDialogProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (authority && isOpen) {
      // Format dates for input (YYYY-MM-DD)
      // Check multiple date fields and handle various formats
      const startDateStr = authority.startDate || authority.start_date || authority.startAt || '';
      const endDateStr = authority.endDate || authority.end_date || authority.endAt || '';
      
      let startDate = '';
      let endDate = '';
      
      if (startDateStr) {
        try {
          // Try to parse and format
          const date = startDateStr.includes('T') 
            ? new Date(startDateStr.split('T')[0])
            : new Date(startDateStr);
          if (!isNaN(date.getTime())) {
            startDate = date.toISOString().split('T')[0];
          } else if (startDateStr.includes('-') && startDateStr.length >= 10) {
            // Already in YYYY-MM-DD format
            startDate = startDateStr.substring(0, 10);
          }
        } catch {
          // Keep empty if parsing fails
        }
      }
      
      if (endDateStr) {
        try {
          // Try to parse and format
          const date = endDateStr.includes('T') 
            ? new Date(endDateStr.split('T')[0])
            : new Date(endDateStr);
          if (!isNaN(date.getTime())) {
            endDate = date.toISOString().split('T')[0];
          } else if (endDateStr.includes('-') && endDateStr.length >= 10) {
            // Already in YYYY-MM-DD format
            endDate = endDateStr.substring(0, 10);
          }
        } catch {
          // Keep empty if parsing fails
        }
      }
      
      setFormData({
        name: authority.name || '',
        startDate: startDate,
        endDate: endDate,
      });
    }
  }, [authority, isOpen]);

  const handleUpdate = async () => {
    if (!authority?.id) return;

    // Validate required fields
    if (!formData.name || !formData.startDate || !formData.endDate) {
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

    setIsUpdating(true);
    try {
      await authorityApi.update(authority.id, clubAdminId, {
        name: formData.name,
        startDate: formData.startDate, // Already in YYYY-MM-DD format
        endDate: formData.endDate,     // Already in YYYY-MM-DD format
      });

      toast.success('Authority updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update authority');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
    });
    onClose();
  };

  if (!authority) return null;

  const student = authority.student || authority.studentResponseDto || {};

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
            <Pencil className="h-5 w-5 text-accent" />
            Edit Authority
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update authority role and duration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="glass-card p-4 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
                {(student.firstname?.[0] || '') + (student.lastname?.[0] || '')}
              </div>
              <div>
                <p className="font-semibold text-white">
                  {student.firstname} {student.lastname}
                </p>
                {student.email && (
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-white">
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
              id="edit-name"
              placeholder="Or type custom role name (3-50 characters)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-2 glass-card border-primary/20"
            />
            <p className="text-xs text-muted-foreground">
              Select from common roles or type a custom role name
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-startDate" className="text-white">
                Start Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="glass-card border-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-endDate" className="text-white">
                End Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-endDate"
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
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleUpdate}
            disabled={isUpdating || !formData.name || !formData.startDate || !formData.endDate}
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
                Update Authority
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAuthorityDialog;

