import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Shield, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import EmptyState from '@/components/admin/EmptyState';

interface AuthoritiesListProps {
  authorities: any[];
  onEdit: (authority: any) => void;
  onDelete: (authority: any) => void;
  isLoading: boolean;
}

const AuthoritiesList = ({
  authorities,
  onEdit,
  onDelete,
  isLoading,
}: AuthoritiesListProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      let date: Date;
      try {
        date = parseISO(dateString);
      } catch {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) return 'N/A';
      
      return format(date, 'MMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    const role = (roleName || '').toUpperCase();
    if (role === 'ADMIN' || role === 'PRESIDENT') {
      return 'bg-primary/10 text-primary border-primary/30';
    } else if (role === 'SECRETARY' || role === 'TREASURER') {
      return 'bg-accent/10 text-accent border-accent/30';
    } else if (role.includes('VICE') || role.includes('DEPUTY')) {
      return 'bg-info/10 text-info border-info/30';
    } else {
      return 'bg-success/10 text-success border-success/30';
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (authorities.length === 0) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <EmptyState
            icon={Shield}
            title="No Authorities"
            description="No authority roles have been assigned yet. Create an authority to assign leadership roles to club members."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="text-white">Member</TableHead>
                <TableHead className="text-white">Role</TableHead>
                <TableHead className="text-white">Start Date</TableHead>
                <TableHead className="text-white">End Date</TableHead>
                <TableHead className="text-white">Duration</TableHead>
                <TableHead className="text-white text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authorities.map((authority) => {
                const student = authority.student || authority.studentResponseDto || {};
                
                // Parse dates with fallback handling
                let startDate: Date | null = null;
                let endDate: Date | null = null;
                
                const startDateStr = authority.startDate || authority.start_date || authority.startAt;
                const endDateStr = authority.endDate || authority.end_date || authority.endAt;
                
                if (startDateStr) {
                  try {
                    try {
                      startDate = parseISO(startDateStr);
                    } catch {
                      startDate = new Date(startDateStr);
                    }
                    if (isNaN(startDate.getTime())) startDate = null;
                  } catch {
                    startDate = null;
                  }
                }
                
                if (endDateStr) {
                  try {
                    try {
                      endDate = parseISO(endDateStr);
                    } catch {
                      endDate = new Date(endDateStr);
                    }
                    if (isNaN(endDate.getTime())) endDate = null;
                  } catch {
                    endDate = null;
                  }
                }
                
                // Calculate duration
                let duration = 'N/A';
                if (startDate && endDate) {
                  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  if (days > 0) {
                    duration = days === 1 ? '1 day' : `${days} days`;
                  } else if (days === 0) {
                    duration = 'Same day';
                  } else {
                    duration = 'Invalid range';
                  }
                } else if (startDate) {
                  duration = 'Ongoing';
                }

                return (
                  <TableRow
                    key={authority.id}
                    className="border-primary/20 hover:bg-primary/10 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                          {(student.firstname?.[0] || '') + (student.lastname?.[0] || '')}
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {student.firstname && student.lastname 
                              ? `${student.firstname} ${student.lastname}`
                              : student.firstname || student.lastname
                              ? `${student.firstname || ''} ${student.lastname || ''}`.trim()
                              : 'Unknown Student'}
                          </div>
                          {student.email && (
                            <div className="text-xs text-muted-foreground">{student.email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(authority.name || authority.authority || '')}>
                        {(() => {
                          const roleName = authority.name || authority.authority || 'N/A';
                          // Remove ROLE_ prefix if present and normalize
                          const normalized = roleName.replace(/^ROLE_/, '').toUpperCase();
                          return normalized === 'ADMIN' ? 'Club Admin' : normalized === 'SUPER_USER' ? 'Authority' : roleName;
                        })()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white">
                      {formatDate(authority.startDate || authority.start_date || authority.startAt)}
                    </TableCell>
                    <TableCell className="text-white">
                      {formatDate(authority.endDate || authority.end_date || authority.endAt)}
                    </TableCell>
                    <TableCell className="text-white">
                      <span className="text-sm">{duration}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(authority)}
                          className="h-8 w-8 p-0 text-accent hover:text-accent hover:bg-accent/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(authority)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthoritiesList;

