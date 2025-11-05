import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Loader2, Users } from 'lucide-react';
import { clubApi } from '@/lib/api';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AssignClubAdminDialogProps {
  club: any;
  members: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignClubAdminDialog = ({ club, members, isOpen, onClose, onSuccess }: AssignClubAdminDialogProps) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedMemberId('');
    }
  }, [isOpen]);

  const handleAssign = async () => {
    if (!selectedMemberId || !club?.id) {
      toast.error('Please select a member');
      return;
    }

    setIsLoading(true);
    try {
      await clubApi.assignClubAdmin(club.id, parseInt(selectedMemberId));
      toast.success('Club admin assigned successfully');
      onSuccess();
      onClose();
      setSelectedMemberId('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign club admin');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out members who are already admins
  const availableMembers = members.filter((member) => {
    const role = member.role || 'STUDENT';
    return role === 'STUDENT';
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Assign Club Admin
          </DialogTitle>
          <DialogDescription>
            Promote a member to club admin for {club?.title || club?.name || 'this club'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No members available to assign</p>
            </div>
          ) : availableMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>All members are already admins</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Select Member</label>
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a member to promote" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>
                            {member.firstname} {member.lastname}
                          </span>
                          {member.email && (
                            <span className="text-xs text-muted-foreground">({member.email})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="glass-card p-3 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 inline mr-1" />
                  This member will be promoted to club admin and can manage club events, announcements, and members.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
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
                  type="button"
                  onClick={handleAssign}
                  className="flex-1 bg-gradient-primary"
                  disabled={isLoading || !selectedMemberId}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Assign Admin
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignClubAdminDialog;

