import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Building2, Calendar, Shield, Phone, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getRoleBadgeColor } from '@/lib/roles';

interface MemberDetailsModalProps {
  member: any | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  authorities?: any[];
}

const MemberDetailsModal = ({ member, isOpen, onClose, isLoading = false, authorities = [] }: MemberDetailsModalProps) => {
  if (!member && !isLoading) return null;

  // Get member's authorities/roles in this club
  const memberAuthorities = authorities.filter((auth: any) => {
    const studentId = auth.student?.id || auth.studentId || auth.studentResponseDto?.id;
    return studentId != null && member?.id != null && (
      Number(studentId) === Number(member.id) ||
      studentId === member.id
    );
  });

  const memberRoles = memberAuthorities.map((auth: any) => {
    // Normalize role name
    const roleName = auth.name || auth.authority || 'STUDENT';
    // Remove ROLE_ prefix if present
    return roleName.replace(/^ROLE_/, '').toUpperCase();
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-primary/20 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl neon-text text-white flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Member Details
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Complete information about the club member
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : member ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-primary/20">
              <div className="h-20 w-20 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {(member.firstname?.[0] || '') + (member.lastname?.[0] || '')}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">
                  {member.firstname} {member.lastname}
                </h3>
                <p className="text-muted-foreground mb-2">{member.email}</p>
                <div className="flex flex-wrap gap-2">
                  {memberRoles.length > 0 ? (
                    memberRoles.map((role: string, index: number) => (
                      <Badge key={index} className={getRoleBadgeColor(role)}>
                        {role === 'ADMIN' ? 'Club Admin' : role === 'SUPER_USER' ? 'Authority' : role}
                      </Badge>
                    ))
                  ) : (
                    <Badge className="bg-success/10 text-success">Student</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-white">{member.email || 'N/A'}</p>
                  </div>
                </div>
                {member.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="text-white">{member.phone}</p>
                    </div>
                  </div>
                )}
                {member.address && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="text-white">{member.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Academic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {member.department && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="text-white">{member.department}</p>
                    </div>
                  </div>
                )}
                {member.yearOfStay && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Year of Stay</p>
                      <p className="text-white">{member.yearOfStay}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Club Roles */}
            {memberAuthorities.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-white text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Club Roles
                </h4>
                <div className="space-y-2">
                  {memberAuthorities.map((auth: any, index: number) => (
                    <div
                      key={index}
                      className="glass-card p-3 rounded-lg border border-primary/20"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">
                            {(() => {
                              const roleName = auth.name || auth.authority || 'Authority';
                              const normalized = roleName.replace(/^ROLE_/, '').toUpperCase();
                              return normalized === 'ADMIN' ? 'Club Admin' : normalized === 'SUPER_USER' ? 'Authority' : normalized;
                            })()}
                          </p>
                          {auth.description && (
                            <p className="text-sm text-muted-foreground">{auth.description}</p>
                          )}
                        </div>
                        {(() => {
                          const startDate = auth.startDate || auth.start_date || auth.startAt;
                          if (!startDate) return null;
                          
                          try {
                            let date: Date;
                            try {
                              date = parseISO(startDate);
                            } catch {
                              date = new Date(startDate);
                            }
                            
                            if (isNaN(date.getTime())) return null;
                            
                            return (
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Since</p>
                                <p className="text-sm text-white">
                                  {format(date, 'MMM dd, yyyy')}
                                </p>
                              </div>
                            );
                          } catch {
                            return null;
                          }
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Join Date */}
            {(() => {
              // Check multiple date fields for join date
              const joinDate = member.createdAt || member.joinedAt || member.dateJoined || member.joinDate || member.created_at || member.joined_at;
              if (!joinDate) return null;
              
              try {
                // Try parseISO first, then fallback to Date constructor
                let date: Date;
                try {
                  date = parseISO(joinDate);
                } catch {
                  date = new Date(joinDate);
                }
                
                if (isNaN(date.getTime())) return null;
                
                return (
                  <div className="pt-4 border-t border-primary/20">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Joined: {format(date, 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                );
              } catch {
                return null;
              }
            })()}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No member data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MemberDetailsModal;

