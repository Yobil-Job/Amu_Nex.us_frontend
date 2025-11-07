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

  // Load user's authorities (their positions in clubs)
  const loadUserAuthorities = async () => {
    try {
      const authoritiesRes = await authorityApi.getByStudent(user?.id || 0).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
      const allAuthorities = extractCollection<any>(authoritiesRes) || [];

      // Filter authorities for the current user
      // SUPER_USER role means they have authorities assigned by club admin
      // Authority name is their position (e.g., "President", "Secretary", etc.)
      const userAuths = allAuthorities.filter((auth: any) => {
        const studentId = auth.student?.id || auth.studentId;
        return studentId === user?.id;
      });

      setUserAuthorities(userAuths);

      if (userAuths.length === 0) {
        toast.info('You are not assigned as an authority for any club yet. Please contact your club admin to assign you a position.');
        setStats((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Get unique club IDs
      const clubIds = [...new Set(userAuths.map((auth: any) => auth.club?.id || auth.clubId))].filter(Boolean);

      if (clubIds.length === 0) {
        toast.error('No clubs found for your authorities');
        setStats((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Fetch club details for the first club (if multiple, can add selector later)
      try {
        const clubId = clubIds[0];
        const club = await clubApi.getById(clubId);
        setSelectedClub(club);

        // Set user position for this club
        const userAuthForClub = userAuths.find((auth: any) => (auth.club?.id || auth.clubId) === clubId);
        if (userAuthForClub) {
          setUserPosition(userAuthForClub.name || 'Authority');
        }
      } catch (error) {
        console.error('Failed to load club:', error);
        toast.error('Failed to load club information');
        setStats((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error: any) {
      console.error('Failed to load authorities:', error);
      toast.error('Failed to load your authorities');
      setStats((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const loadDashboardData = async () => {
    if (!selectedClub?.id) return;

    setStats((prev) => ({ ...prev, isLoading: true }));

    try {
      const clubId = selectedClub.id;

      // Load all data in parallel
      const [
        membersRes,
        eventsRes,
        announcementsRes,
        requestsRes,
      ] = await Promise.all([
        clubApi.getMembers(clubId).catch(() => ({ _embedded: { studentResponseDtoList: [] } })),
        eventApi.getByClub(clubId).catch(() => ({ _embedded: { eventList: [] } })),
        announcementApi.getByClub(clubId).catch(() => ({ _embedded: { announcementResponseDtoList: [] } })),
        clubApi.getPendingRequests(clubId).catch(() => ({ _embedded: { requestResponseDtoList: [] } })),
      ]);

      const membersList = extractCollection<any>(membersRes) || [];
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
        totalMembers: membersList.length,
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
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Dashboard
              {userPosition && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
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
              <User className="h-5 w-5 text-primary" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                {user?.firstname?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">
                  {user?.firstname} {user?.lastname}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {userPosition && (
                  <Badge className="mt-2 bg-primary/20 text-primary border-primary/30">
                    {userPosition}
                  </Badge>
                )}
              </div>
            </div>
            {selectedClub && (
              <div className="pt-4 border-t border-primary/20">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-primary" />
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
      <QuickAccessCards
        pendingRequestsCount={pendingRequestsCount}
        pendingEventRequestsCount={0} // TODO: Implement when event proposals are added
        pendingFinanceRequestsCount={0} // TODO: Implement when finance requests are added
      />

      {/* Stats Summary */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-primary/20 glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Total Members
            </CardTitle>
            <div className="p-3 rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
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

        <Card className="glass-card border-primary/20 glow-effect">
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

        <Card className="glass-card border-primary/20 glow-effect">
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

        <Card className="glass-card border-primary/20 glow-effect">
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
      </div>
    </div>
  );
};

export default SuperUserDashboard;

