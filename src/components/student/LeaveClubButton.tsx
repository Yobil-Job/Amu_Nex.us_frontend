import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LogOut, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { studentApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LeaveClubButtonProps {
  clubName: string;
  clubId: number;
  onLeave?: () => void;
}

const LeaveClubButton = ({ clubName, clubId, onLeave }: LeaveClubButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeave = async () => {
    if (!user?.id) {
      toast.error('Please login to leave a club');
      return;
    }

    setIsLeaving(true);
    
    try {
      // Try to call leave club endpoint (if it exists)
      // DELETE /student/{studentId}/clubs/{clubId}/leave
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/student/${user.id}/clubs/${clubId}/leave`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast.success(`Successfully left ${clubName}`);
        // Navigate to clubs page after leaving
        navigate('/clubs');
        // If a callback is provided, call it
        if (onLeave) {
          onLeave();
        }
      } else if (response.status === 404) {
        // Endpoint doesn't exist - show info message
        toast.info('Leave club endpoint not available. This is a UI-only action.');
        // Still call callback for UI updates
        if (onLeave) {
          onLeave();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to leave club');
      }
    } catch (error: any) {
      console.error('Failed to leave club:', error);
      // If it's a network error or endpoint doesn't exist, treat as UI-only
      if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        toast.info('Leave club endpoint not available. This is a UI-only action.');
        if (onLeave) {
          onLeave();
        }
      } else {
        toast.error('Failed to leave club. Please try again.');
      }
    } finally {
      setIsLeaving(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setIsDialogOpen(true)}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Leave Club
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Leave Club?</DialogTitle>
                <DialogDescription className="mt-1">
                  Are you sure you want to leave {clubName}?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action will remove you from the club. You will no longer receive updates, 
              announcements, or be able to participate in club activities. You can request to 
              join again in the future.
            </p>
            <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> This is a UI-only action. A backend endpoint is required 
                to actually remove you from the club.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLeaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={isLeaving}
            >
              {isLeaving ? 'Leaving...' : 'Leave Club'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeaveClubButton;
