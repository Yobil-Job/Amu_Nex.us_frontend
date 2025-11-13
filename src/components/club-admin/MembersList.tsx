import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, UserMinus, MoreVertical } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getRoleBadgeColor } from '@/lib/roles';
import { cn } from '@/lib/utils';

interface MembersListProps {
  members: any[];
  authorities: any[];
  isLoading: boolean;
  onViewDetails: (member: any) => void;
  onRemoveMember: (member: any) => void;
  currentPage: number;
  itemsPerPage: number;
}

const MembersList = ({
  members,
  authorities,
  isLoading,
  onViewDetails,
  onRemoveMember,
  currentPage,
  itemsPerPage,
}: MembersListProps) => {
  // Get member roles from authorities
  const getMemberRoles = (memberId: number) => {
    return authorities.filter((auth: any) => {
      const studentId = auth.student?.id || auth.studentId || auth.studentResponseDto?.id;
      return studentId != null && (
        Number(studentId) === Number(memberId) ||
        studentId === memberId
      );
    }).map((auth: any) => {
      // Normalize role name
      const roleName = auth.name || auth.authority || 'STUDENT';
      // Remove ROLE_ prefix if present
      return roleName.replace(/^ROLE_/, '').toUpperCase();
    });
  };

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = members.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <UserMinus className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No members found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-primary/20">
            <TableHead className="text-white">Member</TableHead>
            <TableHead className="text-white">Department</TableHead>
            <TableHead className="text-white">Year</TableHead>
            <TableHead className="text-white">Roles</TableHead>
            <TableHead className="text-white">Joined</TableHead>
            <TableHead className="text-white text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedMembers.map((member) => {
            const memberRoles = getMemberRoles(member.id);
            const hasAuthority = memberRoles.length > 0;

            return (
              <TableRow
                key={member.id}
                className="border-primary/20 hover:bg-primary/10 transition-colors"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {(member.firstname?.[0] || '') + (member.lastname?.[0] || '')}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {member.firstname} {member.lastname}
                      </div>
                      <div className="text-xs text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-white">
                  {member.department || 'N/A'}
                </TableCell>
                <TableCell className="text-white">
                  {member.yearOfStay || 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {hasAuthority ? (
                      memberRoles.map((role: string, index: number) => (
                        <Badge key={index} className={cn('text-xs', getRoleBadgeColor(role))}>
                          {role === 'ADMIN' ? 'Club Admin' : role === 'SUPER_USER' ? 'Authority' : role}
                        </Badge>
                      ))
                    ) : (
                      <Badge className="bg-success/10 text-success text-xs">Student</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-white">
                  {(() => {
                    // Check multiple date fields for join date
                    const joinDate = member.createdAt || member.joinedAt || member.dateJoined || member.joinDate || member.created_at || member.joined_at;
                    if (!joinDate) return 'N/A';
                    
                    try {
                      // Try parseISO first, then fallback to Date constructor
                      let date: Date;
                      try {
                        date = parseISO(joinDate);
                      } catch {
                        date = new Date(joinDate);
                      }
                      
                      if (isNaN(date.getTime())) return 'N/A';
                      
                      return (
                        <span className="text-sm">
                          {format(date, 'MMM dd, yyyy')}
                        </span>
                      );
                    } catch {
                      return 'N/A';
                    }
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card border-primary/20">
                      <DropdownMenuItem
                        onClick={() => onViewDetails(member)}
                        className="cursor-pointer"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onRemoveMember(member)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default MembersList;

