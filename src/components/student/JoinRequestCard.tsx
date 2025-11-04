import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface JoinRequest {
  id: string; // Combination of clubId-studentId or timestamp
  clubId: number;
  clubName?: string;
  clubTitle?: string;
  clubType?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

interface JoinRequestCardProps {
  request: JoinRequest;
  onViewDetails?: (clubId: number) => void;
}

const JoinRequestCard = ({ request, onViewDetails }: JoinRequestCardProps) => {
  const getStatusIcon = () => {
    switch (request.status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-accent" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'approved':
        return <Badge className="bg-success/20 text-success border-success/30">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-accent/20 text-accent border-accent/30">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusMessage = () => {
    switch (request.status) {
      case 'approved':
        return 'Your request has been approved! Welcome to the club.';
      case 'rejected':
        return 'Your request was not approved. You can try again later.';
      case 'pending':
        return 'Your request is being reviewed by the club admins.';
      default:
        return '';
    }
  };

  return (
    <Card className={`border-l-4 ${
      request.status === 'approved' ? 'border-l-success' :
      request.status === 'rejected' ? 'border-l-destructive' :
      'border-l-accent'
    } hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">
                {request.clubTitle || request.clubName || 'Unknown Club'}
              </CardTitle>
              {request.clubType && (
                <CardDescription className="mt-1">
                  {request.clubType}
                </CardDescription>
              )}
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {getStatusMessage()}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Requested: {format(new Date(request.requestedAt), 'MMM dd, yyyy HH:mm')}</span>
        </div>
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(request.clubId)}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <Building2 className="h-3 w-3" />
            View Club Details
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default JoinRequestCard;
