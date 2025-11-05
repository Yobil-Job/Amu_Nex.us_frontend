import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Eye, Clock, Building2, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';

interface JoinRequestsListProps {
  requests: any[];
  selectedRequests: number[];
  onSelectRequest: (requestId: number | string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onViewDetails: (request: any) => void;
  onApprove: (clubId: number, studentId: number) => void;
  onReject: (clubId: number, studentId: number) => void;
  isLoading: boolean;
}

const JoinRequestsList = ({
  requests,
  selectedRequests,
  onSelectRequest,
  onSelectAll,
  onViewDetails,
  onApprove,
  onReject,
  isLoading,
}: JoinRequestsListProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch {
      try {
        const date = new Date(dateString);
        return format(date, 'MMM dd, yyyy');
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

  const allSelected = requests.length > 0 && selectedRequests.length === requests.length;
  const someSelected = selectedRequests.length > 0 && selectedRequests.length < requests.length;

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
        <CardContent className="p-12">
          <div className="text-center">
            <Clock className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg">No join requests found</p>
            <p className="text-muted-foreground text-sm mt-2">
              Try adjusting your filters or check back later
            </p>
          </div>
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
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                    title="Select all pending requests"
                  />
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => {
                const student = request.student || request;
                const club = request.club || {};
                const requestId = request.requestId || request.id || `${club.id}-${student.id}`;
                // Handle both string and number IDs for comparison
                const requestIdNum = typeof requestId === 'string' ? parseInt(requestId) || requestId : requestId;
                const isSelected = selectedRequests.some((selectedId) => {
                  return selectedId === requestIdNum || selectedId === requestId;
                });
                const isPending = (request.status || 'PENDING').toUpperCase() === 'PENDING';

                return (
                  <TableRow key={requestId} className={isSelected ? 'bg-primary/10' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelectRequest(requestId, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {(student.firstname?.[0] || '') + (student.lastname?.[0] || '')}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {student.firstname} {student.lastname}
                          </div>
                          <div className="text-xs text-muted-foreground">{student.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="text-white">
                          {club.title || club.name || `Club ${club.id}`}
                        </span>
                      </div>
                      {club.club_Type && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {club.club_Type}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(request.createdAt || request.date || request.requestDate)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(request)}
                          className="hover:bg-primary/10"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isPending && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onApprove(club.id, student.id)}
                              className="text-success hover:text-success hover:bg-success/10"
                              title="Approve request"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onReject(club.id, student.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Reject request"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {!isPending && (
                          <span className="text-xs text-muted-foreground">
                            {request.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                          </span>
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

