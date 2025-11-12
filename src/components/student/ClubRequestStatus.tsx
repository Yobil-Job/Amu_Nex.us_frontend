import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import JoinRequestCard from './JoinRequestCard';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

interface JoinRequest {
  id: string;
  clubId: number;
  clubName?: string;
  clubTitle?: string;
  clubType?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

interface ClubRequestStatusProps {
  requests: JoinRequest[];
  onViewClubDetails?: (clubId: number) => void;
}

const ClubRequestStatus = ({ requests, onViewClubDetails }: ClubRequestStatusProps) => {
  const pendingRequests = useMemo(() => {
    const filtered = requests.filter(req => req.status === 'pending');
    if (import.meta.env.DEV) {
      console.log('📊 Pending requests:', filtered.length, filtered);
    }
    return filtered;
  }, [requests]);

  const approvedRequests = useMemo(() => {
    const filtered = requests.filter(req => req.status === 'approved');
    if (import.meta.env.DEV) {
      console.log('✅ Approved requests:', filtered.length, filtered);
    }
    return filtered;
  }, [requests]);

  const rejectedRequests = useMemo(() => {
    const filtered = requests.filter(req => req.status === 'rejected');
    if (import.meta.env.DEV) {
      console.log('❌ Rejected requests:', filtered.length, filtered);
    }
    return filtered;
  }, [requests]);

  const EmptyState = ({ icon: Icon, title, message }: { icon: any; title: string; message: string }) => (
    <Card>
      <CardContent className="text-center py-12">
        <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Join Requests
            </CardTitle>
            <CardDescription>
              Track the status of your club join requests
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {requests.length} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="relative">
              Approved
              {approvedRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs bg-success/20 text-success">
                  {approvedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="relative">
              Rejected
              {rejectedRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs bg-destructive/20 text-destructive">
                  {rejectedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-4">
            {pendingRequests.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No Pending Requests"
                message="You don't have any pending join requests at the moment."
              />
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <JoinRequestCard
                    key={request.id}
                    request={request}
                    onViewDetails={onViewClubDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 mt-4">
            {approvedRequests.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No Approved Requests"
                message="You haven't had any join requests approved yet."
              />
            ) : (
              <div className="space-y-4">
                {approvedRequests.map((request) => (
                  <JoinRequestCard
                    key={request.id}
                    request={request}
                    onViewDetails={onViewClubDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4 mt-4">
            {rejectedRequests.length === 0 ? (
              <EmptyState
                icon={XCircle}
                title="No Rejected Requests"
                message="None of your join requests have been rejected."
              />
            ) : (
              <div className="space-y-4">
                {rejectedRequests.map((request) => (
                  <JoinRequestCard
                    key={request.id}
                    request={request}
                    onViewDetails={onViewClubDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ClubRequestStatus;
