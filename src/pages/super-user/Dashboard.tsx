import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, Shield, User } from 'lucide-react';
import { clubApi, eventApi, announcementApi, authorityApi, feeApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import ClubOverviewCard from '@/components/super-user/ClubOverviewCard';
import QuickAccessCards from '@/components/super-user/QuickAccessCards';
import NotificationsPanel from '@/components/super-user/NotificationsPanel';
import { format, parseISO } from 'date-fns';
import { Users, Calendar, Bell, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SuperUserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [userAuthorities, setUserAuthorities] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [userPosition, setUserPosition] = useState<string>('');
  const [stats, setStats] = useState({
    totalMembers: 0,
    upcomingEvents: 0,
    totalAnnouncements: 0,
    pendingRequests: 0,
    isLoading: true,
  });

  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadUserAuthorities();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClub?.id) {
      loadDashboardData();
    }
  }, [selectedClub?.id]);

  // Load user's authorized clubs (using shared utility - same approach as club admin)
  const loadUserAuthorities = async () => {
    if (!user?.id) return;
    
    try {
      const { loadAuthorizedClubsForUser, getUserPositionForClub } = await import('@/lib/superUserUtils');
      const clubs = await loadAuthorizedClubsForUser(user.id);

      if (clubs.length === 0) {
        toast.info('You are not assigned as an authority for any club yet. Please contact your club admin to assign you a position.');
        setStats((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Use the first club (if multiple, can add selector later)
      const club = clubs[0];
      setSelectedClub(club);

      // Get user position for this club
      const clubId = club.id || club.clubId;
      if (clubId) {
        const position = await getUserPositionForClub(user.id, Number(clubId));
        if (position) {
          setUserPosition(position);
        }
      }

      // Also store all authorities for reference
      try {
        const authoritiesRes = await authorityApi.getByStudent(user.id).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
        const allAuthorities = extractCollection<any>(authoritiesRes) || [];
        const userAuths = allAuthorities.filter((auth: any) => {
          const studentId = auth.student?.id || auth.studentId || auth.studentResponseDto?.id;
          return studentId === user.id || Number(studentId) === Number(user.id);
        });
        setUserAuthorities(userAuths);
      } catch (err) {
        // Silently fail - not critical
      }
    } catch (error: any) {
      console.error('Failed to load authorized clubs:', error);
      toast.error('Failed to load your club information');
      setStats((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const loadDashboardData = async () => {
    if (!selectedClub?.id) return;

    setStats((prev) => ({ ...prev, isLoading: true }));

    try {
      const clubId = selectedClub.id;

      // SUPER_USER cannot access /clubs/{clubId}/get-members (restricted to SUPER_ADMIN and ADMIN)
      // Instead, use numberOfMmbers from ResponseClubDto (populated by ClubMapper)
      let memberCount = 0;
      
      // Try to get member count from selectedClub (ResponseClubDto has numberOfMmbers field)
      // ClubMapper.toResponseClubDto() sets this using studentClubRepository.countApprovedMembersByClubId()
      if (selectedClub.numberOfMmbers !== undefined && selectedClub.numberOfMmbers !== null) {
        memberCount = Number(selectedClub.numberOfMmbers);
        if (import.meta.env.DEV) {
          console.log('✅ [SuperUserDashboard] Using member count from selectedClub.numberOfMmbers:', memberCount);
        }
      } else if (selectedClub.numberOfMembers !== undefined && selectedClub.numberOfMembers !== null) {
        memberCount = Number(selectedClub.numberOfMembers);
        if (import.meta.env.DEV) {
          console.log('✅ [SuperUserDashboard] Using member count from selectedClub.numberOfMembers:', memberCount);
        }
      } else {
        // Fallback: Try to fetch club details to get updated member count
        if (import.meta.env.DEV) {
          console.warn('⚠️ [SuperUserDashboard] numberOfMmbers not found in selectedClub, trying to fetch club details');
          console.log('🔍 [SuperUserDashboard] selectedClub keys:', Object.keys(selectedClub));
        }
        try {
          const clubDetails = await clubApi.getById(clubId);
          const club = extractCollection<any>(clubDetails)?.[0] || clubDetails;
          memberCount = Number(club?.numberOfMmbers || club?.numberOfMembers || 0);
          // Update selectedClub with fresh data if we got it
          if (club && (club.numberOfMmbers !== undefined || club.numberOfMembers !== undefined)) {
            setSelectedClub((prev: any) => ({ ...prev, ...club }));
            if (import.meta.env.DEV) {
              console.log('✅ [SuperUserDashboard] Fetched member count from club details:', memberCount);
            }
          }
        } catch (err) {
          // If we can't fetch club details, member count stays 0
          if (import.meta.env.DEV) {
            console.warn('⚠️ [SuperUserDashboard] Could not fetch club details for member count:', err);
          }
        }
      }

      // Load other data in parallel
      const [
        eventsRes,
        announcementsRes,
        requestsRes,
      ] = await Promise.all([
        eventApi.getByClub(clubId).catch(() => ({ _embedded: { eventList: [] } })),
        announcementApi.getByClub(clubId).catch(() => ({ _embedded: { announcementResponseDtoList: [] } })),
        clubApi.getPendingRequests(clubId).catch(() => ({ _embedded: { requestResponseDtoList: [] } })),
      ]);

      const eventsList = extractCollection<any>(eventsRes) || [];
      const announcementsList = extractCollection<any>(announcementsRes) || [];
      const requestsList = extractCollection<any>(requestsRes) || [];

      setPendingRequestsCount(requestsList.length);

      // Calculate upcoming events (events after today)
      const now = new Date();
      const upcomingEventsList = eventsList.filter((event: any) => {
        try {
          if (!event.startAt) return false;
          const eventDate = new Date(event.startAt);
          return eventDate > now;
        } catch {
          return false;
        }
      });

      // Get recent events (sorted by date, most recent first)
      const sortedRecentEvents = eventsList
        .filter((event: any) => event.startAt)
        .sort((a: any, b: any) => {
          try {
            const dateA = parseISO(a.startAt);
            const dateB = parseISO(b.startAt);
            return dateB.getTime() - dateA.getTime();
          } catch {
            return 0;
          }
        })
        .slice(0, 5);

      setRecentEvents(sortedRecentEvents);

      setStats({
        totalMembers: memberCount,
        upcomingEvents: upcomingEventsList.length,
        totalAnnouncements: announcementsList.length,
        pendingRequests: requestsList.length,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setStats((prev) => ({ ...prev, isLoading: false }));
    }
  };

  if (!selectedClub && !stats.isLoading) {
    return (
      <div className="space-y-8 animate-fade-in min-h-screen pb-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Welcome back, {user?.firstname || 'User'}!
            </p>
          </div>
        </div>
        <div className="luxury-divider"></div>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-12 text-center">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No Club Assigned</h3>
            <p className="text-muted-foreground mb-4">
              You are not assigned as an authority for any club yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact your club admin to assign you a position (e.g., President, Secretary, Finance Office Head, etc.).
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl super-user-gradient super-user-glow">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Dashboard
              {userPosition && (
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 super-user-text">
                  {userPosition}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-lg">
              Welcome back, {user?.firstname || 'User'}! Manage your club activities.
            </p>
          </div>
        </div>
        {selectedClub?.id && (
          <NotificationsPanel clubId={selectedClub.id} />
        )}
      </div>

      <div className="luxury-divider"></div>

      {/* Profile Widget & Club Overview */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Profile Widget */}
        <Card className="glass-card border-primary/20 glow-effect">
          <CardHeader>
            <CardTitle className="text-lg neon-text text-white flex items-center gap-2">
              <User className="h-5 w-5 text-blue-400" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-full super-user-gradient flex items-center justify-center text-2xl font-bold text-white super-user-glow">
                {user?.firstname?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">
                  {user?.firstname} {user?.lastname}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {userPosition && (
                  <Badge className="mt-2 bg-blue-500/20 text-blue-300 border-blue-500/30 super-user-text">
                    {userPosition}
                  </Badge>
                )}
              </div>
            </div>
            {selectedClub && (
              <div className="pt-4 border-t border-primary/20">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-blue-400" />
                  <span className="text-muted-foreground">Club:</span>
                  <span className="text-white font-medium">{selectedClub.title || selectedClub.name}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Club Overview Card */}
        <div className="lg:col-span-2">
          <ClubOverviewCard
            club={selectedClub}
            recentEvents={recentEvents}
            memberCount={stats.totalMembers}
            pendingRequestsCount={stats.pendingRequests}
            isLoading={stats.isLoading}
          />
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Quick Access</h2>
          <p className="text-sm text-muted-foreground">Click on any card to navigate</p>
        </div>
        <QuickAccessCards
          pendingRequestsCount={pendingRequestsCount}
          pendingEventRequestsCount={0} // TODO: Implement when event proposals are added
          pendingFinanceRequestsCount={0} // TODO: Implement when finance requests are added
        />
      </div>

      {/* Stats Summary */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Statistics Overview</h2>
        <TooltipProvider>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card border-blue-500/20 glow-effect super-user-border cursor-pointer hover:border-blue-500/40 transition-all">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Total Members
                    </CardTitle>
                    <div className="p-3 rounded-xl bg-blue-500/10">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {stats.isLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <div className="text-3xl font-bold neon-text text-white">
                        {stats.totalMembers}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="top" className="glass-card border-primary/20 bg-background/95 backdrop-blur-md">
                <p className="text-white">Total number of club members</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card border-primary/20 glow-effect cursor-pointer hover:border-success/40 transition-all">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Upcoming Events
                    </CardTitle>
                    <div className="p-3 rounded-xl bg-success/10">
                      <Calendar className="h-5 w-5 text-success" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {stats.isLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <div className="text-3xl font-bold neon-text text-white">
                        {stats.upcomingEvents}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="top" className="glass-card border-primary/20 bg-background/95 backdrop-blur-md">
                <p className="text-white">Number of upcoming club events</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card border-primary/20 glow-effect cursor-pointer hover:border-primary/40 transition-all">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Announcements
                    </CardTitle>
                    <div className="p-3 rounded-xl bg-info/10">
                      <Bell className="h-5 w-5 text-info" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {stats.isLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <div className="text-3xl font-bold neon-text text-white">
                        {stats.totalAnnouncements}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="top" className="glass-card border-primary/20 bg-background/95 backdrop-blur-md">
                <p className="text-white">Total number of club announcements</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="glass-card border-primary/20 glow-effect cursor-pointer hover:border-accent/40 transition-all">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Pending Requests
                    </CardTitle>
                    <div className="p-3 rounded-xl bg-accent/10">
                      <Clock className="h-5 w-5 text-accent" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {stats.isLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <div className="text-3xl font-bold neon-text text-white">
                        {stats.pendingRequests}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="top" className="glass-card border-primary/20 bg-background/95 backdrop-blur-md">
                <p className="text-white">Number of pending join requests requiring approval</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default SuperUserDashboard;

