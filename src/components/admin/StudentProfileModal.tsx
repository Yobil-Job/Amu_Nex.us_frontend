import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, GraduationCap, Clock, Shield, Building2, Calendar, User } from 'lucide-react';
import { getRoleBadgeColor, getRoleDisplayName } from '@/lib/roles';
import StudentClubMemberships from './StudentClubMemberships';
import { Skeleton } from '@/components/ui/skeleton';

interface StudentProfileModalProps {
  student: any;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

const StudentProfileModal = ({ student, isOpen, onClose, isLoading }: StudentProfileModalProps) => {
  if (!student && !isLoading) return null;

  const getInitials = (firstname?: string, lastname?: string, email?: string) => {
    if (firstname && lastname) {
      return `${firstname[0]}${lastname[0]}`.toUpperCase();
    }
    if (firstname) {
      return firstname[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg font-bold">
                {getInitials(student?.firstname, student?.lastname, student?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  {student?.firstname} {student?.lastname}
                </span>
                {student?.role && (
                  <Badge className={getRoleBadgeColor(student.role)}>
                    {getRoleDisplayName(student.role)}
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-base">
            Complete student profile and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <div className="glass-card p-4 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-white">Personal Information</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Full Name</div>
                  <div className="text-sm font-medium text-white">
                    {student?.firstname} {student?.lastname}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Email</div>
                  <div className="flex items-center gap-2 text-sm text-white">
                    <Mail className="h-3 w-3" />
                    {student?.email || 'N/A'}
                  </div>
                </div>
                {student?.gender && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Gender</div>
                    <Badge variant="secondary">{student.gender}</Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card p-4 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-5 w-5 text-accent" />
                <h3 className="font-semibold text-white">Academic Information</h3>
              </div>
              <div className="space-y-3">
                {student?.department && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Department</div>
                    <div className="flex items-center gap-2 text-sm text-white">
                      <GraduationCap className="h-3 w-3" />
                      {student.department}
                    </div>
                  </div>
                )}
                {student?.yearOfStay && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Year of Stay</div>
                    <div className="flex items-center gap-2 text-sm text-white">
                      <Clock className="h-3 w-3" />
                      {student.yearOfStay.replace('_', ' ')}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Student ID</div>
                  <div className="text-sm font-mono text-white">
                    {student?.id || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Club Memberships */}
          {student?.id && (
            <StudentClubMemberships studentId={student.id} />
          )}

          {/* Additional Info */}
          <div className="glass-card p-4 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-info" />
              <h3 className="font-semibold text-white">Account Details</h3>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Role</div>
                <Badge className={getRoleBadgeColor(student?.role)}>
                  {getRoleDisplayName(student?.role)}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Account Status</div>
                <Badge className="bg-success/20 text-success border-success/30">
                  Active
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentProfileModal;

