import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Users, Mail, GraduationCap, Shield, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getRoleBadgeColor, getRoleDisplayName } from '@/lib/roles';
import { clubApi } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';

interface ClubMembersListProps {
  members: any[];
  isLoading: boolean;
  clubId: number;
  onDemoteSuccess?: () => void;
}

const ClubMembersList = ({ members, isLoading, clubId, onDemoteSuccess }: ClubMembersListProps) => {
  const [demotingId, setDemotingId] = useState<number | null>(null);

  const handleDemote = async (memberId: number) => {
    if (!confirm('Are you sure you want to demote this club admin? They will lose admin privileges.')) {
      return;
    }

    setDemotingId(memberId);
    try {
      await clubApi.demoteClubAdmin(clubId, memberId);
      toast.success('Club admin demoted successfully');
      onDemoteSuccess?.();
    } catch (error: any) {
      if (error.status === 404) {
        toast.error('Demote endpoint not found. Please contact administrator.');
        console.warn('Demote club admin endpoint not implemented in backend');
      } else {
        toast.error(error.message || 'Failed to demote club admin');
      }
    } finally {
      setDemotingId(null);
    }
  };
  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Club Members
        </CardTitle>
        <CardDescription>
          {members.length} {members.length === 1 ? 'member' : 'members'} in this club
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {(member.firstname?.[0] || '') + (member.lastname?.[0] || '')}
                        </div>
                        <div>
                          <div className="text-white">
                            {member.firstname} {member.lastname}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-white">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {member.email || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.department ? (
                        <Badge variant="outline">{member.department}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.yearOfStay ? (
                        <Badge variant="secondary">
                          {member.yearOfStay.replace('_', ' ')}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(member.role || 'STUDENT')}>
                        {getRoleDisplayName(member.role || 'STUDENT')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {(member.role === 'ADMIN' || member.role === 'ROLE_ADMIN') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDemote(member.id)}
                          disabled={demotingId === member.id}
                          className="text-warning hover:text-warning"
                        >
                          <ArrowDown className="h-3 w-3 mr-1" />
                          {demotingId === member.id ? 'Demoting...' : 'Demote'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubMembersList;

