import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, User, Mail, GraduationCap, Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface JoinRequestDetailsModalProps {
  request: any;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

const JoinRequestDetailsModal = ({ request, isOpen, onClose, isLoading }: JoinRequestDetailsModalProps) => {
  if (!request && !isLoading) return null;

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

  const getStatusBadge = (status?: string) => {
    const statusUpper = (status || 'PENDING').toUpperCase();
    switch (statusUpper) {
      case 'APPROVED':
        return (
          <Badge className="bg-success/10 text-success border-success/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
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

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const student = request?.student || request;
  const club = request?.club || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <User className="h-6 w-6 text-primary" />
            Join Request Details
          </DialogTitle>
          <DialogDescription className="text-base">
            Complete information about this join request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Request Status</div>
            {getStatusBadge(request?.status)}
          </div>

          {/* Student Information */}
          <div className="glass-card p-4 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg font-bold">
                  {getInitials(student?.firstname, student?.lastname, student?.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-white text-lg">
                  {student?.firstname} {student?.lastname}
                </h3>
                <p className="text-sm text-muted-foreground">Student Information</p>
              </div>
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Email</div>
                <div className="flex items-center gap-2 text-sm text-white">
                  <Mail className="h-3 w-3" />
                  {student?.email || 'N/A'}
                </div>
              </div>
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
                  <div className="text-sm text-white">
                    {student.yearOfStay.replace('_', ' ')}
                  </div>
                </div>
              )}
              {student?.gender && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Gender</div>
                  <div className="text-sm text-white">{student.gender}</div>
                </div>
              )}
            </div>
          </div>

          {/* Club Information */}
          <div className="glass-card p-4 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-8 w-8 text-accent" />
              <div>
                <h3 className="font-semibold text-white text-lg">
                  {club?.title || club?.name || `Club ${club?.id || 'N/A'}`}
                </h3>
                <p className="text-sm text-muted-foreground">Requested Club</p>
              </div>
            </div>
            {club?.club_Type && (
              <div className="mb-3">
                <Badge variant="outline">{club.club_Type}</Badge>
              </div>
            )}
            {club?.description && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Description</div>
                <p className="text-sm text-muted-foreground">{club.description}</p>
              </div>
            )}
          </div>

          {/* Request Details */}
          <div className="glass-card p-4 rounded-lg border border-primary/20">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Request Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Request Date:</span>
                <span className="text-white flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {formatDate(request?.createdAt || request?.date || request?.requestDate)}
                </span>
              </div>
              {request?.status !== 'PENDING' && request?.updatedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="text-white">{formatDate(request.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinRequestDetailsModal;

