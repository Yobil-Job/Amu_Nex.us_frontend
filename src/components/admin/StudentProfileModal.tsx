import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, GraduationCap, Clock, Shield, Building2, Calendar, User, Award } from 'lucide-react';
import { getRoleBadgeColor, getRoleDisplayName } from '@/lib/roles';
import StudentClubMemberships from './StudentClubMemberships';
import { Skeleton } from '@/components/ui/skeleton';
import { studentApi, authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useEffect, useState } from 'react';

interface StudentProfileModalProps {
  student: any;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

const StudentProfileModal = ({ student, isOpen, onClose, isLoading: externalLoading }: StudentProfileModalProps) => {
  const [fullStudent, setFullStudent] = useState<any>(null);
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch full student details when modal opens
  useEffect(() => {
    if (isOpen && student?.id) {
      loadFullStudentData();
    } else if (!isOpen) {
      // Reset state when modal closes
      setFullStudent(null);
      setAuthorities([]);
    }
  }, [isOpen, student?.id]);

  const loadFullStudentData = async () => {
    if (!student?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch full student details
      const [studentRes, authoritiesRes] = await Promise.all([
        studentApi.getById(student.id).catch(() => null),
        authorityApi.getByStudent(student.id).catch(() => ({ _embedded: { authorityResponseDtoList: [] } })),
      ]);

      if (studentRes) {
        setFullStudent(studentRes);
      } else {
        // Fallback to passed student object if API fails
        setFullStudent(student);
      }

      // Extract authorities
      const authoritiesList = extractCollection<any>(authoritiesRes) || [];
      setAuthorities(authoritiesList);
    } catch (error) {
      console.error('Failed to load student details:', error);
      // Fallback to passed student object
      setFullStudent(student);
    } finally {
      setIsLoading(false);
    }
  };

  const displayStudent = fullStudent || student;
  const isActuallyLoading = externalLoading || isLoading;

  if (!displayStudent && !isActuallyLoading) return null;

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

  if (isActuallyLoading) {
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
                {getInitials(displayStudent?.firstname, displayStudent?.lastname, displayStudent?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  {displayStudent?.firstname} {displayStudent?.lastname}
                </span>
                {displayStudent?.role && (
                  <Badge className={getRoleBadgeColor(displayStudent.role)}>
                    {getRoleDisplayName(displayStudent.role)}
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
                    {displayStudent?.firstname} {displayStudent?.lastname}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Email</div>
                  <div className="flex items-center gap-2 text-sm text-white">
                    <Mail className="h-3 w-3" />
                    {displayStudent?.email || 'N/A'}
                  </div>
                </div>
                {displayStudent?.gender && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Gender</div>
                    <Badge variant="secondary">{displayStudent.gender}</Badge>
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
                {displayStudent?.department && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Department</div>
                    <div className="flex items-center gap-2 text-sm text-white">
                      <GraduationCap className="h-3 w-3" />
                      {displayStudent.department}
                    </div>
                  </div>
                )}
                {displayStudent?.yearOfStay && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Year of Stay</div>
                    <div className="flex items-center gap-2 text-sm text-white">
                      <Clock className="h-3 w-3" />
                      {displayStudent.yearOfStay.replace('_', ' ')}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Student ID</div>
                  <div className="text-sm font-mono text-white">
                    {displayStudent?.id || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Club Memberships */}
          {displayStudent?.id && (
            <StudentClubMemberships studentId={displayStudent.id} />
          )}

          {/* Authorities/Roles in Clubs */}
          {authorities.length > 0 && (
            <div className="glass-card p-4 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-accent" />
                <h3 className="font-semibold text-white">Club Authorities</h3>
              </div>
              <div className="space-y-2">
                {authorities.map((authority) => (
                  <div
                    key={authority.id}
                    className="flex items-center justify-between p-2 rounded-md bg-primary/5 border border-primary/10"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {authority.position || authority.role || 'Member'}
                      </div>
                      {authority.clubName && (
                        <div className="text-xs text-muted-foreground">
                          {authority.clubName}
                        </div>
                      )}
                    </div>
                    {authority.clubId && (
                      <Badge variant="outline" className="text-xs">
                        Club ID: {authority.clubId}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
                <Badge className={getRoleBadgeColor(displayStudent?.role)}>
                  {getRoleDisplayName(displayStudent?.role)}
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

