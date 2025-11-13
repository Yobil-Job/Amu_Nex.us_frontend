import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, RefreshCw, Search, X } from 'lucide-react';
import { clubApi, authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { loadManagedClubsForUser } from '@/lib/clubAdminUtils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import JoinRequestsList from '@/components/club-admin/JoinRequestsList';
import ApproveRequestDialog from '@/components/club-admin/ApproveRequestDialog';
import RejectRequestDialog from '@/components/club-admin/RejectRequestDialog';
import { Badge } from '@/components/ui/badge';

const ClubAdminJoinRequests = () => {
  const { user } = useAuth();
  const [managedClubs, setManagedClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadManagedClubs();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClub?.id) {
      loadJoinRequests();
      // Set up interval to check for new requests every 30 seconds
      const interval = setInterval(loadJoinRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedClub?.id]);

  // Load clubs where user is assigned as club admin (ADMIN role)
  const loadManagedClubs = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const clubs = await loadManagedClubsForUser(user.id);

      if (clubs.length === 0) {
        toast.info('You are not assigned as a club admin for any club yet. Please contact the system administrator.');
        setIsLoading(false);
        return;
      }

      setManagedClubs(clubs);

      if (clubs.length === 1) {
        setSelectedClub(clubs[0]);
      } else if (clubs.length > 1) {
        setSelectedClub(clubs[0]);
      }
    } catch (error: any) {
      console.error('Failed to load managed clubs:', error);
      toast.error('Failed to load your clubs');
    } finally {
      setIsLoading(false);
    }
  };

  const loadJoinRequests = async () => {
    if (!selectedClub?.id) return;

    setIsLoading(true);
    try {
      const requestsRes = await clubApi.getPendingRequests(selectedClub.id).catch(() => ({ _embedded: { requestResponseDtoList: [] } }));
      const requestsList = extractCollection<any>(requestsRes) || [];
      
      // Enrich requests with club info
      const enrichedRequests = requestsList.map((request: any) => ({
        ...request,
        club: selectedClub,
        status: request.status || 'PENDING',
      }));

      setAllRequests(enrichedRequests);
    } catch (error: any) {
      toast.error('Failed to load join requests');
      setAllRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    let filtered = [...allRequests];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((request) => {
        const student = request.student || request;
        const firstname = (student.firstname || '').toLowerCase();
        const lastname = (student.lastname || '').toLowerCase();
        const email = (student.email || '').toLowerCase();
        const department = (student.department || '').toLowerCase();
        return (
          firstname.includes(query) ||
          lastname.includes(query) ||
          email.includes(query) ||
          department.includes(query) ||
          `${firstname} ${lastname}`.includes(query)
        );
      });
    }

    return filtered;
  }, [allRequests, searchQuery]);

  const handleApprove = (request: any) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  const handleReject = (request: any) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const handleViewDetails = (request: any) => {
    // For now, just show a toast with request details
    const student = request.student || request;
    toast.info(`${student.firstname} ${student.lastname} - ${student.email}`);
  };

  const handleSuccess = () => {
    loadJoinRequests();
  };

  const pendingCount = allRequests.filter((r) => !r.status || r.status === 'PENDING').length;

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Join Requests' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Clock className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Join Requests
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedClub
                ? `Manage join requests for ${selectedClub.title || selectedClub.name || 'Club'}`
                : 'Select a club to manage requests'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Badge className="bg-warning/10 text-warning border-warning/30 text-lg px-4 py-2">
              {pendingCount} Pending
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadJoinRequests}
            disabled={isLoading || !selectedClub}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="luxury-divider"></div>

      {/* Club Selector (if managing multiple clubs) */}
      {managedClubs.length > 1 && (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-white">Select Club:</label>
              <select
                value={selectedClub?.id || ''}
                onChange={(e) => {
                  const club = managedClubs.find((c) => c.id === Number(e.target.value));
                  setSelectedClub(club || null);
                }}
                className="glass-card border-primary/20 px-4 py-2 rounded-lg bg-background text-white flex-1 max-w-md"
              >
                {managedClubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.title || club.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedClub ? (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-12 text-center">
            <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No Club Assigned</h3>
            <p className="text-muted-foreground">
              You are not assigned as a club admin for any club yet. Please contact the system administrator.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search Bar */}
          <Card className="glass-card border-primary/20">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{allRequests.length}</div>
                <div className="text-sm text-muted-foreground">Total Requests</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-warning">{pendingCount}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{filteredRequests.length}</div>
                <div className="text-sm text-muted-foreground">Filtered Results</div>
              </CardContent>
            </Card>
          </div>

          {/* Join Requests List */}
          <JoinRequestsList
            requests={filteredRequests}
            onViewDetails={handleViewDetails}
            onApprove={handleApprove}
            onReject={handleReject}
            isLoading={isLoading}
          />
        </>
      )}

      {/* Modals */}
      <ApproveRequestDialog
        request={selectedRequest}
        clubId={selectedClub?.id || 0}
        isOpen={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        onSuccess={handleSuccess}
      />

      <RejectRequestDialog
        request={selectedRequest}
        clubId={selectedClub?.id || 0}
        isOpen={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default ClubAdminJoinRequests;

