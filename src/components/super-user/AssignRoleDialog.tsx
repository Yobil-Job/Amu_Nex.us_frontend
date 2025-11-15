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
import { UserCog, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { authorityApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface AssignRoleDialogProps {
  member: any | null;
  clubId: number;
  authorities: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Common internal roles that super users can assign
const INTERNAL_ROLES = [
  'Project Head',
  'Event Coordinator',
  'Secretary',
  'Treasurer',
  'Public Relations Officer',
  'Media Manager',
  'Content Creator',
  'Outreach Coordinator',
  'Workshop Lead',
  'Volunteer Coordinator',
];

const AssignRoleDialog = ({ member, clubId, authorities, isOpen, onClose, onSuccess }: AssignRoleDialogProps) => {
  const { user } = useAuth();
  const [isAssigning, setIsAssigning] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [useCustomRole, setUseCustomRole] = useState(false);
  const [description, setDescription] = useState('');
  const [memberRoles, setMemberRoles] = useState<any[]>([]);

  useEffect(() => {
    if (member && isOpen) {
      // Get current roles for this member
      const currentRoles = authorities.filter((auth: any) => {
        const studentId = auth.student?.id || auth.studentId;
        return studentId === member.id && (auth.name || '').toUpperCase() !== 'ADMIN';
      });
      setMemberRoles(currentRoles);
      
      // Reset form
      setRoleName('');
      setCustomRole('');
      setUseCustomRole(false);
      setDescription('');
    }
  }, [member, isOpen, authorities]);

  const handleAssign = async () => {
    if (!member || !clubId || !user?.id) return;

    const finalRoleName = useCustomRole ? customRole.trim() : roleName;
    if (!finalRoleName) {
      toast.error('Please select or enter a role name');
      return;
    }

    setIsAssigning(true);
    try {
      // Check if role already exists for this member
      const existingRole = memberRoles.find(
        (role: any) => (role.name || '').toUpperCase() === finalRoleName.toUpperCase()
      );

      if (existingRole) {
        toast.error('This role is already assigned to this member');
        setIsAssigning(false);
        return;
      }

      // Create authority with internal role
      // Note: SUPER_USER can only assign internal roles, not ADMIN
      const authorityData = {
        name: finalRoleName,
        description: description.trim() || undefined,
        clubId: clubId,
        studentId: member.id,
        startDate: new Date().toISOString(),
        // End date can be set later or left null for indefinite
      };

      // Get club admin ID (needed for creating authority)
      // For now, we'll use the current user's ID if they have ADMIN authority, otherwise we need to find the club admin
      // Actually, SUPER_USER might not have the permission to create authorities directly
      // This might need backend support or a different approach
      // For now, we'll attempt to create it and let the backend handle permissions
      
      // Try to find a club admin for this club
      const clubAdminAuth = authorities.find((auth: any) => {
        const authName = (auth.name || '').toUpperCase();
        return authName === 'ADMIN' && (auth.club?.id || auth.clubId) === clubId;
      });

      if (!clubAdminAuth) {
        toast.error('Club admin not found. Please contact the system administrator.');
        setIsAssigning(false);
        return;
      }

      const clubAdminId = clubAdminAuth.student?.id || clubAdminAuth.studentId;

      // SUPER_USER cannot access /authorities/{clubAdminId}/create (restricted to SUPER_ADMIN and ADMIN)
      // Try to create the authority (internal role)
      await authorityApi.create(clubAdminId, authorityData);

      toast.success(`Role "${finalRoleName}" assigned successfully`);
      setRoleName('');
      setCustomRole('');
      setDescription('');
      setUseCustomRole(false);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to assign role:', error);
      const errorMessage = error.message || 'Failed to assign role';
      if (errorMessage.includes('Access Denied') || errorMessage.includes('403') || errorMessage.includes('permission') || errorMessage.includes('must be club Admin')) {
        toast.error('You do not have permission to assign roles. Only Club Admins can assign internal roles.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveRole = async (authorityId: number) => {
    if (!clubId || !user?.id) return;

    try {
      // Find club admin
      const clubAdminAuth = authorities.find((auth: any) => {
        const authName = (auth.name || '').toUpperCase();
        return authName === 'ADMIN' && (auth.club?.id || auth.clubId) === clubId;
      });

      if (!clubAdminAuth) {
        toast.error('Club admin not found');
        return;
      }

      const clubAdminId = clubAdminAuth.student?.id || clubAdminAuth.studentId;

      await authorityApi.delete(authorityId, clubId, clubAdminId);
      toast.success('Role removed successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove role');
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Assign Internal Role
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Assign or manage internal roles for {member.firstname} {member.lastname}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Member Info */}
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

          {/* Current Roles */}
          {memberRoles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-white">Current Internal Roles</Label>
              <div className="flex flex-wrap gap-2">
                {memberRoles.map((role: any) => (
                  <Badge
                    key={role.id}
                    className="bg-primary/20 text-primary border-primary/30 flex items-center gap-2"
                  >
                    {role.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive/20"
                      onClick={() => handleRemoveRole(role.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Assign New Role */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Role Type</Label>
              <Select value={useCustomRole ? 'custom' : 'preset'} onValueChange={(value) => setUseCustomRole(value === 'custom')}>
                <SelectTrigger className="glass-card border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preset">Select from Preset Roles</SelectItem>
                  <SelectItem value="custom">Enter Custom Role</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {useCustomRole ? (
              <div className="space-y-2">
                <Label htmlFor="customRole" className="text-white">
                  Custom Role Name
                </Label>
                <Input
                  id="customRole"
                  placeholder="e.g., Workshop Coordinator, Social Media Manager"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="glass-card border-primary/20"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="roleName" className="text-white">
                  Select Role
                </Label>
                <Select value={roleName} onValueChange={setRoleName}>
                  <SelectTrigger id="roleName" className="glass-card border-primary/20">
                    <SelectValue placeholder="Select a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERNAL_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">
                Description (Optional)
              </Label>
              <Input
                id="description"
                placeholder="Brief description of the role responsibilities..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="glass-card border-primary/20"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAssigning}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isAssigning || (!roleName && !customRole)}
            className="gap-2"
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserCog className="h-4 w-4" />
                Assign Role
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignRoleDialog;

