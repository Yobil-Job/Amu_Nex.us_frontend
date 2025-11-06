import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Eye, Clock, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import EmptyState from '@/components/admin/EmptyState';

interface JoinRequestsListProps {
  requests: any[];
  onViewDetails: (request: any) => void;
  onApprove: (request: any) => void;
  onReject: (request: any) => void;
  isLoading: boolean;
}

const JoinRequestsList = ({
  requests,
  onViewDetails,
  onApprove,
  onReject,
  isLoading,
}: JoinRequestsListProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      try {
        const date = new Date(dateString);
        return format(date, 'MMM dd, yyyy HH:mm');
      } catch {
        return dateString;
      }
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusUpper = (status || 'PENDING').toUpperCase();
    switch (statusUpper) {
      case 'APPROVED':
        return (
          <Badge className="bg-success/10 text-success border-success/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-warning/10 text-warning border-warning/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
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

  if (requests.length === 0) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <EmptyState
            icon={Clock}
            title="No Join Requests"
            description="There are no pending join requests at the moment."
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
                <TableHead className="text-white">Student</TableHead>
                <TableHead className="text-white">Email</TableHead>
                <TableHead className="text-white">Department</TableHead>
                <TableHead className="text-white">Request Date</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => {
                const student = request.student || request;
                const requestId = request.studentId || request.student?.id || request.id;

                return (
                  <TableRow
                    key={requestId}
                    className="border-primary/20 hover:bg-primary/10 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                          {(student.firstname?.[0] || '') + (student.lastname?.[0] || '')}
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {student.firstname} {student.lastname}
                          </div>
                          {student.yearOfStay && (
                            <div className="text-xs text-muted-foreground">{student.yearOfStay}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">{student.email || 'N/A'}</TableCell>
                    <TableCell className="text-white">{student.department || 'N/A'}</TableCell>
                    <TableCell className="text-white">
                      {formatDate(request.requestDate || request.createdAt)}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(request)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(!request.status || request.status === 'PENDING') && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onApprove(request)}
                              className="h-8 w-8 p-0 text-success hover:text-success hover:bg-success/10"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onReject(request)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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

export default JoinRequestsList;

