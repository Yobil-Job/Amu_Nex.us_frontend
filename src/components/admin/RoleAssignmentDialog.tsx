import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Shield, Loader2 } from 'lucide-react';
import { authorityApi, clubApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getRoleDisplayName } from '@/lib/roles';

interface RoleAssignmentDialogProps {
  student: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RoleAssignmentDialog = ({ student, isOpen, onClose, onSuccess }: RoleAssignmentDialogProps) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [clubs, setClubs] = useState<any[]>([]);
  const [existingAuthorities, setExistingAuthorities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (student?.id && isOpen) {
      loadData();
    }
  }, [student?.id, isOpen]);

  const loadData = async () => {
    if (!student?.id) return;
    setIsLoadingData(true);
    try {
      // Load clubs from club API (since authority API doesn't have getAll)
      const [clubsRes, authoritiesRes] = await Promise.all([
        clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } })),
        authorityApi.getByStudent(student.id).catch(() => ({ _embedded: { authorityResponseDtoList: [] } })),
      ]);

      const clubsList = extractCollection<any>(clubsRes);
      const authoritiesList = extractCollection<any>(authoritiesRes) || [];

      // Extract unique clubs from authorities, or use all clubs if student has no authorities
      const clubMap = new Map();
      if (authoritiesList.length > 0) {
        authoritiesList.forEach((auth: any) => {
          if (auth.club?.id) {
            clubMap.set(auth.club.id, auth.club);
          }
        });
      } else {
        // If no authorities, show all clubs
        clubsList.forEach((club: any) => {
          clubMap.set(club.id, club);
        });
      }
      setClubs(Array.from(clubMap.values()));
      setExistingAuthorities(authoritiesList);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedRole || !student?.id) {
      toast.error('Please select a role');
      return;
    }

    // For SUPER_USER role, club is required
    if (selectedRole === 'SUPER_USER' && !selectedClubId) {
      toast.error('Please select a club for club admin role');
      return;
    }

    setIsLoading(true);
    try {
      // Note: Backend API requires clubAdminId, but we're assigning to a student
      // This might need adjustment based on actual backend implementation
      // For now, we'll use the student's ID as the clubAdminId
      await authorityApi.create(student.id, {
        name: selectedRole,
        clubId: selectedClubId ? parseInt(selectedClubId) : undefined,
      });
      
      toast.success(`Role ${getRoleDisplayName(selectedRole)} assigned successfully`);
      onSuccess();
      onClose();
      setSelectedRole('');
      setSelectedClubId('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRole = async (authorityId: number) => {
    if (!confirm('Are you sure you want to remove this role?')) return;

    setIsLoading(true);
    try {
      // Note: Backend API requires clubId and clubAdminId
      // For now, we'll use the authority's club and student info
      const authority = existingAuthorities.find((auth) => auth.id === authorityId);
      if (!authority) {
        toast.error('Authority not found');
        return;
      }

      const clubId = authority.club?.id || 0;
      const clubAdminId = student?.id || 0;
      
      await authorityApi.delete(authorityId, clubId, clubAdminId);
      toast.success('Role removed successfully');
      onSuccess();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove role');
    } finally {
      setIsLoading(false);
    }
  };

  const existingRoles = existingAuthorities.map((auth: any) => ({
    id: auth.id,
    role: auth.name,
    club: auth.club,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Assign Role
          </DialogTitle>
          <DialogDescription>
            Assign roles to {student?.firstname} {student?.lastname}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isLoadingData ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              {/* Current Roles */}
              {existingRoles.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Roles</Label>
                  <div className="space-y-2">
                    {existingRoles.map((role) => (
                      <div
                        key={role.id}
                        className="glass-card p-3 rounded-lg border border-primary/20 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/10 text-primary">
                            {getRoleDisplayName(role.role)}
                          </Badge>
                          {role.club && (
                            <span className="text-xs text-muted-foreground">
                              in {role.club.title || role.club.name}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRole(role.id)}
                          disabled={isLoading}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assign New Role */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Select Role *</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a role to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="SUPER_USER">Club Admin</SelectItem>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                      <SelectItem value="SUPER_ADMIN">System Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedRole === 'SUPER_USER' && (
                  <div className="space-y-2">
                    <Label htmlFor="club">Select Club *</Label>
                    <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a club" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubs.map((club) => (
                          <SelectItem key={club.id} value={club.id.toString()}>
                            {club.title || club.name || `Club ${club.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {clubs.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No clubs available. The student must be a member of a club first.
                      </p>
                    )}
                  </div>
                )}

                <div className="glass-card p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <p className="text-xs text-muted-foreground">
                    <Shield className="h-3 w-3 inline mr-1" />
                    Assigning <strong>{getRoleDisplayName(selectedRole)}</strong> will grant
                    {selectedRole === 'SUPER_USER' && ' club administration privileges'}
                    {selectedRole === 'ADMIN' && ' administrator privileges'}
                    {selectedRole === 'SUPER_ADMIN' && ' system administrator privileges'}
                    {selectedRole === 'STUDENT' && ' standard student privileges'}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading || isLoadingData}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssign}
              className="flex-1 bg-gradient-primary"
              disabled={isLoading || isLoadingData || !selectedRole || (selectedRole === 'SUPER_USER' && !selectedClubId)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Assign Role
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoleAssignmentDialog;

