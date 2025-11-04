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

interface LeaveClubButtonProps {
  clubName: string;
  onLeave?: () => void;
}

const LeaveClubButton = ({ clubName, onLeave }: LeaveClubButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeave = async () => {
    setIsLeaving(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // UI-only action - no backend endpoint
    toast.info('Leave club feature is UI-only. Backend endpoint is required for actual functionality.');
    
    // If a callback is provided, call it (for potential future integration)
    if (onLeave) {
      onLeave();
    }
    
    setIsLeaving(false);
    setIsDialogOpen(false);
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
