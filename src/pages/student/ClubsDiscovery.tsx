import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { clubApi, studentApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useAuth } from '@/contexts/AuthContext';
import { isStudent } from '@/lib/roles';
import { toast } from 'sonner';
import { Building2, Search, UserPlus, CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ClubRequestStatus from '@/components/student/ClubRequestStatus';
import { addActivity } from '@/components/student/ActivityTimeline';

interface JoinRequest {
  id: string;
  clubId: number;
  clubName?: string;
  clubTitle?: string;
  clubType?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

const STORAGE_KEY = 'student_join_requests';

const ClubsDiscovery = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<any[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState<any | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccessError, setHasAccessError] = useState(false);
  // Default to 'discover' tab so students can explore clubs
  const [activeTab, setActiveTab] = useState<'discover' | 'joined' | 'requests'>('discover');

  const loadJoinRequests = useCallback(() => {
    if (!user?.id) return;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        const requests: JoinRequest[] = JSON.parse(stored);
        setJoinRequests(requests);
      }
    } catch (error) {
      console.error('Failed to load join requests:', error);
    }
  }, [user?.id]);

  const saveJoinRequests = useCallback((requests: JoinRequest[]) => {
    if (!user?.id) return;
    try {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(requests));
      setJoinRequests(requests);
    } catch (error) {
      console.error('Failed to save join requests:', error);
    }
  }, [user?.id]);

  const syncJoinRequestsWithJoinedClubs = useCallback((joined: any[], allClubs: any[] = []) => {
    setJoinRequests(prev => {
      const updated = prev.map(req => {
        // Find matching club from joined clubs
        const joinedClub = joined.find(club => {
          const clubId = club.id || club.clubId || club.club_id;
          const reqClubId = req.clubId;
          return String(clubId) === String(reqClubId);
        });

        // Find matching club from all clubs (for enrichment)
        const clubData = allClubs.find(club => {
          const clubId = club.id || club.clubId || club.club_id;
          const reqClubId = req.clubId;
          return String(clubId) === String(reqClubId);
        });

        // Enrich request with club data if missing
        const enrichedRequest = {
          ...req,
          clubTitle: req.clubTitle || clubData?.title || clubData?.name || joinedClub?.title || joinedClub?.name,
          clubName: req.clubName || clubData?.name || joinedClub?.name,
          clubType: req.clubType || clubData?.club_Type || joinedClub?.club_Type,
        };

        // If student is in the club
        if (joinedClub) {
          // If request was pending, mark as approved
          if (req.status === 'pending') {
            return { ...enrichedRequest, status: 'approved' as const };
          }
          // If request was already approved, keep it approved (enrich with data)
          if (req.status === 'approved') {
            return enrichedRequest;
          }
          // If request was rejected but student is now in club, mark as approved
          if (req.status === 'rejected') {
            return { ...enrichedRequest, status: 'approved' as const };
          }
        } else {
          // Student is NOT in the club
          // If request is pending, check if it should be marked as rejected
          if (req.status === 'pending') {
            const requestedDate = new Date(req.requestedAt);
            const daysSinceRequest = (Date.now() - requestedDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // Check if club still exists
            const clubExists = clubData || allClubs.some(club => {
              const clubId = club.id || club.clubId || club.club_id;
              return String(clubId) === String(req.clubId);
            });

            // If request is older than 7 days, club exists, and student is not in club, mark as rejected
            // This is a heuristic - ideally we'd get this from the backend
            if (daysSinceRequest > 7 && clubExists) {
              return { ...enrichedRequest, status: 'rejected' as const };
            }
            // Otherwise keep as pending but enrich with data
            return enrichedRequest;
          }
          // If request was already approved but student is not in club, keep as approved (might have left)
          if (req.status === 'approved') {
            return enrichedRequest;
          }
          // If request was already rejected, keep as rejected (enrich with data)
          if (req.status === 'rejected') {
            return enrichedRequest;
          }
        }
        
        return enrichedRequest;
      });
      
      if (JSON.stringify(updated) !== JSON.stringify(prev)) {
        saveJoinRequests(updated);
        return updated;
      }
      return prev;
    });
  }, [saveJoinRequests]);

  const loadClubs = async () => {
    setIsLoading(true);
    setHasAccessError(false);
    try {
      const response = await clubApi.getAll();
      const clubsList = extractCollection<any>(response);
      setClubs(clubsList);
    } catch (error: any) {
      const status = error?.status;
      
      // Handle 403 (Access Denied) - set access error flag for UI message
      if (status === 403) {
        setHasAccessError(true);
        setClubs([]);
      } else {
        // For any other error (network, server, etc.), set access error to show helpful UI
        // This way we don't show error toasts, but inform user through UI
        setHasAccessError(true);
        setClubs([]);
      }
      
      // Don't show any error toasts - UI will handle messaging
    } finally {
      setIsLoading(false);
    }
  };

  const loadJoinedClubs = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await studentApi.getClubs(user.id);
      const clubsList = extractCollection<any>(response);
      setJoinedClubs(clubsList);
      // Don't sync here - let the useEffect handle it to avoid double syncing
    } catch (error: any) {
      const status = error?.status;
      
      // Only show error toast for non-403 errors and non-network errors
      if (status && status !== 403 && status !== 0) {
        toast.error(error?.message || 'Failed to load your joined clubs.');
      }
      
      setJoinedClubs([]);
    }
  }, [user?.id]);

  useEffect(() => {
    // Wait for both user ID and role before making any API calls
    if (!user?.id || !user?.role) {
      return;
    }

    // Load all clubs (students can now access this endpoint for club discovery)
    loadClubs();
    
    // Load joined clubs (this endpoint is accessible to students)
    loadJoinedClubs();
    loadJoinRequests();

    // Set up periodic sync to check if requests were approved/rejected
    const syncInterval = setInterval(() => {
      if (user?.id) {
        loadJoinedClubs();
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [user?.id, user?.role, loadJoinedClubs]);

  // Sync requests when joined clubs or all clubs change (to enrich data and update status)
  // This ensures approved/rejected requests have complete club data and correct status
  // Note: We don't include joinRequests in deps to avoid infinite loops (syncJoinRequestsWithJoinedClubs uses setState with prev)
  useEffect(() => {
    // Only sync if we have actual data and user is logged in
    if (!user?.id) return;
    // Only sync if we have join requests loaded (check localStorage to avoid unnecessary work)
    const hasRequests = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
    if (!hasRequests) return;
    
    // Only sync if we have club data
    if (joinedClubs.length === 0 && clubs.length === 0) return;
    
    // Sync will check joinRequests internally via setState callback
    syncJoinRequestsWithJoinedClubs(joinedClubs, clubs);
  }, [joinedClubs.length, clubs.length, user?.id, syncJoinRequestsWithJoinedClubs]);

  const handleJoinClub = async (club: any) => {
    if (!user?.id) {
      toast.error('Please login to join clubs');
      return;
    }

    if (isJoined(club.id)) {
      toast.info('You are already a member of this club');
      return;
    }

    const existingRequest = joinRequests.find(
      req => req.clubId === club.id && req.status === 'pending'
    );
    if (existingRequest) {
      toast.info('You already have a pending request for this club');
      return;
    }

    try {
      await studentApi.requestToJoinClub(user.id, club.id);
      
      const newRequest: JoinRequest = {
        id: `${club.id}-${user.id}-${Date.now()}`,
        clubId: club.id,
        clubTitle: club.title || club.name,
        clubName: club.name,
        clubType: club.club_Type,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };

      const updated = [...joinRequests, newRequest];
      saveJoinRequests(updated);
      
      // Track activity
      addActivity(
        'club_joined',
        `Requested to join ${club.title || club.name}`,
        `Join request sent for ${club.club_Type || 'club'}`
      );
      
      toast.success('Request sent successfully! Waiting for approval.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send join request');
    }
  };

  const isJoined = (clubId: number) => {
    return joinedClubs.some(club => club.id === clubId);
  };

  const hasPendingRequest = (clubId: number) => {
    return joinRequests.some(
      req => req.clubId === clubId && req.status === 'pending'
    );
  };

  const getRequestStatus = (clubId: number): 'pending' | 'approved' | 'rejected' | null => {
    const request = joinRequests.find(req => req.clubId === clubId);
    return request ? request.status : null;
  };

  const filteredClubs = useMemo(() => {
    if (!searchQuery.trim()) return clubs;
    
    const query = searchQuery.toLowerCase();
    return clubs.filter(club => {
      const title = (club.title || club.name || '').toLowerCase();
      const description = (club.description || '').toLowerCase();
      const clubType = (club.club_Type || '').toLowerCase();
      
      return title.includes(query) || 
             description.includes(query) || 
             clubType.includes(query);
    });
  }, [clubs, searchQuery]);

  const openClubDetails = (club: any) => {
    setSelectedClub(club);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight neon-text text-white">
            Club Discovery
          </h1>
          <p className="text-muted-foreground mt-1">
            Explore and join clubs that interest you
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {joinedClubs.length} Joined
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover">
            <Building2 className="h-4 w-4 mr-2" />
            Discover Clubs
            {clubs.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                {clubs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="joined">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            My Clubs
            {joinedClubs.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs bg-success/20 text-success">
                {joinedClubs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Clock className="h-4 w-4 mr-2" />
            Join Requests
            {joinRequests.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs bg-accent/20 text-accent">
                {joinRequests.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clubs by name, description, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
                        ) : filteredClubs.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <>
                      <h3 className="text-lg font-semibold mb-2">
                        {searchQuery ? 'No clubs found' : 'No clubs available'}
                      </h3>
                      <p className="text-muted-foreground">
                        {searchQuery 
                          ? 'Try adjusting your search terms'
                          : hasAccessError 
                            ? 'Unable to load clubs at this time. Please try again later.'
                            : 'There are no clubs available at the moment.'}
                      </p>
                      {hasAccessError && (
                        <Button onClick={() => loadClubs()} className="mt-4">
                          Try Again
                        </Button>
                      )}
                    </>
                  </CardContent>
                </Card>
              ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredClubs.map((club) => {
                const joined = isJoined(club.id);
                const pending = hasPendingRequest(club.id);

                return (
                  <Card
                    key={club.id}
                    className="border-primary/20 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => openClubDetails(club)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {club.logo ? (
                            <img
                              src={club.logo}
                              alt={`${club.title || club.name} logo`}
                              className="w-14 h-14 rounded-full object-cover border-2 border-primary/30 shadow-md flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                if (target.nextElementSibling) {
                                  (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center border-2 border-primary/30 shadow-md flex-shrink-0 ${club.logo ? 'hidden' : ''}`}
                          >
                            <Building2 className="h-7 w-7 text-primary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-xl mb-2 truncate">
                            {club.title || club.name}
                          </CardTitle>
                          {club.club_Type && (
                            <Badge variant="outline" className="mb-2">
                              {club.club_Type}
                            </Badge>
                          )}
                          </div>
                        </div>
                        {joined && (
                          <Badge className="bg-success/20 text-success border-success/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Joined
                          </Badge>
                        )}
                        {pending && !joined && (
                          <Badge className="bg-accent/20 text-accent border-accent/30">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CardDescription className="line-clamp-3">
                        {club.description || 'No description available'}
                      </CardDescription>
                      <div className="flex items-center gap-4 pt-2 border-t">
                        <Button
                          variant={joined ? "secondary" : "default"}
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!joined && !pending) {
                              handleJoinClub(club);
                            } else if (!joined) {
                              openClubDetails(club);
                            }
                          }}
                          disabled={joined || pending}
                        >
                          {joined ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Joined
                            </>
                          ) : pending ? (
                            <>
                              <Clock className="h-4 w-4 mr-2" />
                              Pending
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Join Club
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openClubDetails(club);
                          }}
                        >
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="joined" className="space-y-6">
          {joinedClubs.length === 0 ? (
            <Card className="border-primary/20">
              <CardContent className="text-center py-12">
                <div className="p-4 rounded-full bg-primary/10 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">No Clubs Joined</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't joined any clubs yet. Start exploring and find clubs that match your interests!
                </p>
                <Button 
                  onClick={() => setActiveTab('discover')}
                  className="bg-gradient-primary"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Discover Clubs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Your Clubs ({joinedClubs.length})
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Clubs you're currently a member of
                  </p>
                </div>
              </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {joinedClubs.map((club) => (
                <Card
                  key={club.id}
                    className="border-success/20 hover:shadow-lg hover:border-success/40 transition-all cursor-pointer glass-card"
                    style={{ pointerEvents: 'auto' }}
                  onClick={() => openClubDetails(club)}
                >
                  <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {club.logo ? (
                            <img
                              src={club.logo}
                              alt={`${club.title || club.name} logo`}
                              className="w-16 h-16 rounded-full object-cover border-2 border-success/30 shadow-md flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                if (target.nextElementSibling) {
                                  (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center border-2 border-success/30 shadow-md flex-shrink-0 ${club.logo ? 'hidden' : ''}`}
                          >
                            <Building2 className="h-8 w-8 text-primary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-xl mb-2 truncate text-white">
                          {club.title || club.name}
                        </CardTitle>
                        {club.club_Type && (
                              <Badge variant="outline" className="mb-2 text-xs">
                            {club.club_Type}
                          </Badge>
                        )}
                      </div>
                        </div>
                        <Badge className="bg-success/20 text-success border-success/30 flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Member
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <CardDescription className="line-clamp-2 text-sm">
                      {club.description || 'No description available'}
                    </CardDescription>
                    <Button
                      variant="outline"
                        size="sm"
                        className="w-full border-success/30 hover:bg-success/10 hover:border-success/50"
                        style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
                      onClick={(e) => {
                          e.preventDefault();
                        e.stopPropagation();
                        openClubDetails(club);
                      }}
                    >
                        <Building2 className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <ClubRequestStatus
            requests={joinRequests}
            onViewClubDetails={(clubId) => {
              const club = clubs.find(c => c.id === clubId);
              if (club) {
                openClubDetails(club);
              }
            }}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedClub && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-2">
                      {selectedClub.title || selectedClub.name}
                    </DialogTitle>
                    {selectedClub.club_Type && (
                      <Badge variant="outline" className="mb-2">
                        {selectedClub.club_Type}
                      </Badge>
                    )}
                  </div>
                  {isJoined(selectedClub.id) && (
                    <Badge className="bg-success/20 text-success border-success/30">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Member
                    </Badge>
                  )}
                </div>
              </DialogHeader>
              <DialogDescription className="space-y-4">
                {/* Club Logo */}
                <div className="flex justify-center mb-4">
                  {selectedClub.logo ? (
                    <img
                      src={selectedClub.logo}
                      alt={`${selectedClub.title || selectedClub.name} logo`}
                      className="w-24 h-24 rounded-full object-cover border-4 border-primary/30 shadow-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.nextElementSibling) {
                          (target.nextElementSibling as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center border-4 border-primary/30 shadow-lg ${selectedClub.logo ? 'hidden' : ''}`}
                  >
                    <Building2 className="h-12 w-12 text-primary-foreground" />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    About
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedClub.description || 'No description available'}
                  </p>
                </div>
                
                {/* Club Type */}
                {selectedClub.club_Type && (
                  <div>
                    <h4 className="font-semibold mb-2">Category</h4>
                    <Badge variant="outline" className="text-sm">
                      {selectedClub.club_Type}
                    </Badge>
                  </div>
                )}

                {/* Join Status */}
                <div className="pt-4 border-t">
                  {isJoined(selectedClub.id) ? (
                    <div className="flex items-center gap-2 text-success mb-4">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">You are a member of this club</span>
                    </div>
                  ) : hasPendingRequest(selectedClub.id) ? (
                    <div className="flex items-center gap-2 text-accent mb-4">
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">Your join request is pending approval</span>
                    </div>
                  ) : null}
                </div>
                
                {/* Action Button */}
                <div className="flex flex-wrap gap-4 pt-4 border-t">
                  <Button
                    variant={isJoined(selectedClub.id) ? "secondary" : "default"}
                    className="flex-1"
                    onClick={() => {
                      if (!isJoined(selectedClub.id) && !hasPendingRequest(selectedClub.id)) {
                        handleJoinClub(selectedClub);
                        setIsDetailsDialogOpen(false);
                      }
                    }}
                    disabled={isJoined(selectedClub.id) || hasPendingRequest(selectedClub.id)}
                  >
                    {isJoined(selectedClub.id) ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Already Joined
                      </>
                    ) : hasPendingRequest(selectedClub.id) ? (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Request Pending
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Request to Join
                      </>
                    )}
                  </Button>
                </div>
              </DialogDescription>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubsDiscovery;
