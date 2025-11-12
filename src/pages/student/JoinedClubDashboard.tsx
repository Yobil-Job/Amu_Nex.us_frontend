import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { studentApi, clubApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ClubInfoCard from '@/components/student/ClubInfoCard';
import ClubMembersList from '@/components/student/ClubMembersList';
import LeaveClubButton from '@/components/student/LeaveClubButton';
import { useNavigate } from 'react-router-dom';

const JoinedClubDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinedClubs, setJoinedClubs] = useState<any[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [selectedClub, setSelectedClub] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClubDetails, setIsLoadingClubDetails] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadJoinedClubs();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClubId) {
      loadClubDetails(selectedClubId);
    }
  }, [selectedClubId]);

  // Auto-select first club when clubs are loaded
  useEffect(() => {
    if (joinedClubs.length > 0 && !selectedClubId) {
      setSelectedClubId(joinedClubs[0].id);
    }
  }, [joinedClubs]);

  const loadJoinedClubs = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const response = await studentApi.getClubs(user.id);
      const clubsList = extractCollection<any>(response);
      setJoinedClubs(clubsList);
    } catch (error: any) {
      console.error('Failed to load joined clubs:', error);
      // Don't show error for authorization issues - students might not have permission
      if (error.status !== 403) {
        toast.error('Failed to load your clubs');
      }
      setJoinedClubs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClubDetails = async (clubId: number) => {
    setIsLoadingClubDetails(true);
    try {
      const response = await clubApi.getById(clubId);
      setSelectedClub(response);
    } catch (error: any) {
      console.error('Failed to load club details:', error);
      // Handle 403 (Access Denied) - students might not have permission to view club details
      if (error.status === 403) {
        console.warn('Access denied to club details. Students may only view their joined clubs.');
        // Don't show error toast, just set club to null so UI shows appropriate message
      } else if (error.status !== 403) {
        // Only show error toast for non-403 errors
        toast.error('Failed to load club details');
      }
      setSelectedClub(null);
    } finally {
      setIsLoadingClubDetails(false);
    }
  };

  const handleLeaveClub = () => {
    // Reload clubs after leaving (UI-only action for now)
    loadJoinedClubs();
    // If the left club was selected, select the first available club
    if (joinedClubs.length > 1) {
      const remainingClubs = joinedClubs.filter(c => c.id !== selectedClubId);
      if (remainingClubs.length > 0) {
        setSelectedClubId(remainingClubs[0].id);
      } else {
        setSelectedClubId(null);
        setSelectedClub(null);
      }
    } else {
      setSelectedClubId(null);
      setSelectedClub(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (joinedClubs.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight neon-text text-white">
              Joined Club Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              View details and manage your joined clubs
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/clubs')}>
            <Building2 className="h-4 w-4 mr-2" />
            Discover Clubs
          </Button>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Clubs Joined</h3>
            <p className="text-muted-foreground mb-4">
              You haven't joined any clubs yet. Start exploring to find clubs that interest you!
            </p>
            <Button onClick={() => navigate('/clubs')}>
              <Building2 className="h-4 w-4 mr-2" />
              Discover Clubs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight neon-text text-white">
            Joined Club Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            View details and manage your joined clubs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {joinedClubs.length} {joinedClubs.length === 1 ? 'Club' : 'Clubs'}
          </Badge>
          <Button variant="outline" onClick={() => navigate('/clubs')}>
            <Building2 className="h-4 w-4 mr-2" />
            Discover More
          </Button>
        </div>
      </div>

      {/* Club Selector */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Select a Club
          </CardTitle>
          <CardDescription>
            Choose a club to view its details, members, and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedClubId?.toString() || ''}
            onValueChange={(value) => setSelectedClubId(parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a club to view details" />
            </SelectTrigger>
            <SelectContent>
              {joinedClubs.map((club) => (
                <SelectItem key={club.id} value={club.id.toString()}>
                  {club.title || club.name || `Club ${club.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Club Dashboard */}
      {selectedClubId && (
        <div className="space-y-6">
          {isLoadingClubDetails ? (
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : selectedClub ? (
            <>
              {/* Club Info and Actions */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <ClubInfoCard club={selectedClub} />
                </div>
                <div className="space-y-4">
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/events')}
                      >
                        View Events
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/announcements')}
                      >
                        View Announcements
                      </Button>
                      <LeaveClubButton
                        clubName={selectedClub.title || selectedClub.name || 'this club'}
                        clubId={selectedClubId}
                        onLeave={handleLeaveClub}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Members List */}
              <ClubMembersList clubId={selectedClubId} />
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Failed to Load Club</h3>
                <p className="text-muted-foreground mb-4">
                  Could not load club details. Please try selecting another club.
                </p>
                <Button onClick={() => loadClubDetails(selectedClubId)}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default JoinedClubDashboard;
