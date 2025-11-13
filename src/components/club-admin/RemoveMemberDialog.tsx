import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RemoveMemberDialogProps {
  member: any | null;
  clubId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RemoveMemberDialog = ({ member, clubId, isOpen, onClose, onSuccess }: RemoveMemberDialogProps) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (!member?.id) return;

    setIsRemoving(true);
    try {
      // Try to call remove member endpoint
      // DELETE /student/{studentId}/clubs/{clubId}/leave
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(
        `${API_BASE_URL}/student/${member.id}/clubs/${clubId}/leave`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast.success('Member removed successfully');
        onSuccess();
        onClose();
      } else if (response.status === 404) {
        // Endpoint doesn't exist - show info message
        toast.info('Remove member endpoint not available. This feature requires backend support.');
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to remove member');
      }
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      // If it's a network error or endpoint doesn't exist, treat gracefully
      if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        toast.info('Remove member endpoint not available. This feature requires backend support.');
        onClose();
      } else {
        toast.error(error.message || 'Failed to remove member');
      }
    } finally {
      setIsRemoving(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Remove Member
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to remove this member from the club?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="glass-card p-4 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
                {(member.firstname?.[0] || '') + (member.lastname?.[0] || '')}
              </div>
              <div>
                <p className="font-semibold text-white">
                  {member.firstname} {member.lastname}
                </p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            This action will remove the member from the club. They will no longer have access to club events, announcements, and other club resources.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isRemoving}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isRemoving}
            className="gap-2"
          >
            {isRemoving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Remove Member
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveMemberDialog;

