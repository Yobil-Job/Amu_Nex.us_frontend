import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { clubApi, authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { Users, Shield, Crown, Award, UserCheck, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { isStudent } from '@/lib/roles';

interface ClubMembersListProps {
  clubId: number;
}

interface Member {
  id: number;
  email?: string;
  firstname?: string;
  lastname?: string;
  department?: string;
  yearOfStay?: string;
}

interface Authority {
  id: number;
  name: string;
  student?: Member;
  startDate?: string;
  endDate?: string;
}

const ClubMembersList = ({ clubId }: ClubMembersListProps) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    // Try to load members and authorities for all users
    // Students might have read-only access to view members
    loadMembers();
    loadAuthorities();
  }, [clubId, user?.role]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const response = await clubApi.getMembers(clubId);
      const membersList = extractCollection<Member>(response);
      console.log('📊 Loaded club members:', membersList.length);
      setMembers(membersList);
      setHasAccess(true);
    } catch (error: any) {
      console.error('Failed to load members:', error);
      if (error.status === 403) {
        // Access denied - show appropriate message
        setHasAccess(false);
        setMembers([]);
        // Don't show error toast for 403 - UI will show access restricted message
      } else if (error.status !== 403) {
        // Only show error toast for non-403 errors
        toast.error('Failed to load club members');
        setMembers([]);
      } else {
        setMembers([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuthorities = async () => {
    try {
      const response = await authorityApi.getByClub(clubId);
      const authoritiesList = extractCollection<Authority>(response);
      setAuthorities(authoritiesList);
    } catch (error: any) {
      console.error('Failed to load authorities:', error);
      // Silently fail for authorities - students might not have access
      setAuthorities([]);
    }
  };

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

  const getRoleIcon = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('president') || name.includes('chair')) {
      return <Crown className="h-4 w-4 text-accent" />;
    }
    if (name.includes('secretary')) {
      return <Shield className="h-4 w-4 text-primary" />;
    }
    if (name.includes('finance') || name.includes('treasurer')) {
      return <Award className="h-4 w-4 text-success" />;
    }
    return <UserCheck className="h-4 w-4 text-muted-foreground" />;
  };

  const getAuthorityForStudent = (studentId: number): Authority | undefined => {
    return authorities.find(auth => auth.student?.id === studentId);
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Club Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Club Members
          </CardTitle>
          <CardDescription>
            View club members and leadership
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Members List Restricted</h3>
            <p className="text-muted-foreground text-sm">
              Club members are only visible to club administrators. Contact a club admin for more information.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Club Members
          </CardTitle>
          <CardDescription>
            View club members and leadership
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Members</h3>
            <p className="text-muted-foreground text-sm">
              This club doesn't have any members yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Club Members
            </CardTitle>
            <CardDescription>
              {members.length} {members.length === 1 ? 'member' : 'members'} in this club
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => {
            const authority = getAuthorityForStudent(member.id);
            // Check if member is admin: either has authority role OR has ADMIN role
            const isAdmin = authority !== undefined || member.role === 'ADMIN' || member.role === 'ROLE_ADMIN';
            const displayName = (member.firstname || member.firstName || '') + ' ' + (member.lastname || member.lastName || '');
            const trimmedName = displayName.trim() || member.email || 'Unknown User';

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors"
              >
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarFallback className="bg-gradient-primary/10 text-primary font-semibold">
                    {getInitials(member.firstname || member.firstName, member.lastname || member.lastName, member.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">
                      {trimmedName}
                    </p>
                    {isAdmin && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {authority ? (
                          <>
                            {getRoleIcon(authority.name)}
                            <Badge variant="secondary" className="text-xs">
                              {authority.name}
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                            <Crown className="h-3 w-3 mr-1" />
                            Club Admin
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                    {member.email && (
                      <span className="truncate">{member.email}</span>
                    )}
                    {member.department && (
                      <span className="hidden sm:inline">• {member.department}</span>
                    )}
                    {member.yearOfStay && (
                      <span className="hidden md:inline">• Year {member.yearOfStay}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubMembersList;
