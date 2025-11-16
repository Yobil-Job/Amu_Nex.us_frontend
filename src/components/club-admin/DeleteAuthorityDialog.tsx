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
import { AlertTriangle, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { authorityApi, studentApi, clubApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';

interface DeleteAuthorityDialogProps {
  authority: any | null;
  clubId: number;
  clubAdminId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteAuthorityDialog = ({ authority, clubId, clubAdminId, isOpen, onClose, onSuccess }: DeleteAuthorityDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!authority?.id) return;

    setIsDeleting(true);
    try {
      // Extract student ID - check all possible locations
      const student = authority.student || authority.studentResponseDto || {};
      const studentId = student.id || authority.studentId || authority.student_id;
      
      if (import.meta.env.DEV) {
        console.log('🗑️ Deleting authority:', {
          authorityId: authority.id,
          authorityName: authority.name,
          student: authority.student,
          studentId: studentId,
          authorityKeys: Object.keys(authority),
        });
      }
      
      if (!studentId) {
        console.error('❌ No student ID found in authority object:', authority);
        toast.error('Cannot determine student ID. Role update will be skipped.');
        // Still delete the authority even if we can't update role
        await authorityApi.delete(authority.id, clubId, clubAdminId);
        toast.success('Authority removed successfully');
        onSuccess();
        onClose();
        return;
      }
      
      // Delete the authority
      await authorityApi.delete(authority.id, clubId, clubAdminId);
      
      if (import.meta.env.DEV) {

      }
      
      // After successful deletion, check if student needs role update
      if (studentId) {
        try {
          // Get all clubs to check for other authorities and club admin status
          const clubsRes = await clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } }));
          const clubs = extractCollection<any>(clubsRes) || [];
          
          // Check if student has other authorities by getting student's authorities directly
          // This is more reliable than trying to extract student ID from authority list
          let hasOtherAuthorities = false;
          try {
            // Wait a moment for backend to process the deletion
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const studentAuthoritiesRes = await authorityApi.getByStudent(Number(studentId)).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
            const studentAuthorities = extractCollection<any>(studentAuthoritiesRes) || [];
            
            // Filter out the authority we just deleted (by ID)
            // Also check if any remaining authorities exist
            const remainingAuthorities = studentAuthorities.filter((auth: any) => {
              const authId = auth.id;
              if (!authId) return false;
              // Exclude the authority we just deleted
              return Number(authId) !== Number(authority.id);
            });
            
            hasOtherAuthorities = remainingAuthorities.length > 0;
            
            if (import.meta.env.DEV) {
              console.log('🔍 Checking other authorities for student:', {
                studentId,
                deletedAuthorityId: authority.id,
                totalStudentAuthorities: studentAuthorities.length,
                allAuthorityIds: studentAuthorities.map((a: any) => a.id),
                remainingAuthorities: remainingAuthorities.length,
                remainingAuthorityIds: remainingAuthorities.map((a: any) => a.id),
                hasOtherAuthorities,
              });
            }
          } catch (authCheckError) {
            console.error('Failed to check student authorities:', authCheckError);
            // If we can't check, assume no other authorities to be safe
            hasOtherAuthorities = false;
          }
          
          // Check if student is a club admin
          let isClubAdmin = false;
          for (const club of clubs) {
            const clubAdminId = club.clubAdminId || club.clubAdmin?.id || club.club_admin_id;
            if (clubAdminId != null && (
              Number(clubAdminId) === Number(studentId) ||
              clubAdminId === studentId
            )) {
              isClubAdmin = true;
              break;
            }
          }
          
          // Get current student data
          const currentStudent = await studentApi.getById(Number(studentId));
          
          // Get the role from API (but don't trust it - backend may compute it from authorities)
          const apiReportedRole = (currentStudent.role || 'STUDENT').toUpperCase();

          // Determine what the role SHOULD be based on actual status:
          // SYSTEM_ADMIN > ADMIN (Club Admin) > SUPER_USER (Authority) > STUDENT
          let newRole = 'STUDENT';
          
          if (apiReportedRole === 'SYSTEM_ADMIN') {
            // Never change SYSTEM_ADMIN
            newRole = 'SYSTEM_ADMIN';
          } else if (isClubAdmin) {
            // If student is a club admin, keep as ADMIN
            newRole = 'ADMIN';
          } else if (hasOtherAuthorities) {
            // If student has other authorities, keep as SUPER_USER
            newRole = 'SUPER_USER';
          } else {
            // No authorities and not club admin, set to STUDENT
            newRole = 'STUDENT';
          }
          
          // CRITICAL: Always update the role when we delete an authority if:
          // 1. Student is not SYSTEM_ADMIN (we never change SYSTEM_ADMIN)
          // 2. Either:
          //    a) The API role doesn't match what it should be, OR
          //    b) We just deleted their last authority (force update to STUDENT)
          // This ensures the database role field is updated even if API reports wrong role
          const shouldUpdate = apiReportedRole !== 'SYSTEM_ADMIN' && (
            apiReportedRole !== newRole || 
            (newRole === 'STUDENT' && !hasOtherAuthorities && !isClubAdmin)
          );
          
          console.log('🔍 Role update decision:', {
            studentId,
            roleFromAPI: currentStudent.role,
            apiReportedRole,
            newRole,
            isClubAdmin,
            hasOtherAuthorities,
            shouldUpdate,
            reason: apiReportedRole === 'SYSTEM_ADMIN' 
              ? 'Student is SYSTEM_ADMIN - cannot change'
              : apiReportedRole !== newRole
                ? `Role mismatch: API says ${apiReportedRole}, should be ${newRole}`
                : newRole === 'STUDENT' && !hasOtherAuthorities && !isClubAdmin
                  ? 'Force update to STUDENT (authority deleted)'
                  : 'No update needed',
          });
          
          if (shouldUpdate) {
            try {
              const updateReason = apiReportedRole !== newRole
                ? 'Role mismatch'
                : newRole === 'STUDENT' && !hasOtherAuthorities && !isClubAdmin
                  ? 'Force update (authority deleted)'
                  : 'Update needed';

              // Try updating with just the role field
              const updatePayload = { role: newRole };

              const updateResponse = await studentApi.update(Number(studentId), updatePayload);

              // Wait a moment for backend to process
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Verify the update by fetching the student again
              const updatedStudent = await studentApi.getById(Number(studentId));
              const verifiedRole = updatedStudent.role || updatedStudent.roleName || 'STUDENT';
              
              console.log(`✅ Verification: Student ${studentId} role is now ${verifiedRole}`, {
                expected: newRole,
                actual: verifiedRole,
                matches: verifiedRole === newRole || verifiedRole.toUpperCase() === newRole.toUpperCase(),
                fullStudent: updatedStudent,
              });
              
              // Check if role was updated (case-insensitive comparison)
              const roleMatches = verifiedRole.toUpperCase() === newRole.toUpperCase();
              
              if (roleMatches) {

                toast.success(`Student role updated to ${newRole}`);
              } else {
                console.error(`❌ Role update FAILED: Expected ${newRole}, but student role is still ${verifiedRole}`);
                console.error('Full student object:', updatedStudent);
                toast.error(`Role update failed. Student role is still ${verifiedRole}. Please update manually.`);
              }
            } catch (updateError: any) {
              console.error('❌ Failed to update student role:', updateError);
              console.error('Update error details:', {
                message: updateError.message,
                response: updateError.response,
                status: updateError.status,
                error: updateError,
              });
              
              // Try to get more details from the error
              let errorMessage = updateError.message || 'Unknown error';
              if (updateError.response) {
                try {
                  const errorData = await updateError.response.json();
                  errorMessage = errorData.message || errorData.error || errorMessage;
                  console.error('Error response data:', errorData);
                } catch {
                  // Ignore JSON parse errors
                }
              }
              
              toast.error(`Failed to update student role: ${errorMessage}. Please update manually.`);
            }
          } else {

          }
        } catch (roleCheckError: any) {
          console.error('Failed to check/update student role:', roleCheckError);
          // Don't fail the whole operation if role check fails
          toast.warning('Authority removed, but role update check failed.');
        }
      }
      
      toast.success('Authority removed successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to remove authority:', error);
      toast.error(error.message || 'Failed to remove authority');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!authority) return null;

  const student = authority.student || authority.studentResponseDto || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Remove Authority
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to remove this authority role?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="glass-card p-4 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
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
            <div className="flex items-center gap-2 mt-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm text-white font-medium">Role: {authority.name || 'N/A'}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            This action will remove the authority role from the member. They will no longer have the associated permissions and responsibilities.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Remove Authority
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAuthorityDialog;

