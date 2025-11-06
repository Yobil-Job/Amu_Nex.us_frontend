import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, Sparkles, Activity, Users as UsersIcon, Calendar, Bell } from 'lucide-react';
import { clubApi, eventApi, announcementApi, authorityApi, feeApi, studentApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import StatsCards from '@/components/club-admin/StatsCards';
import MemberGrowthChart from '@/components/club-admin/MemberGrowthChart';
import EventsChart from '@/components/club-admin/EventsChart';
import FeesChart from '@/components/club-admin/FeesChart';
import QuickActionsPanel from '@/components/club-admin/QuickActionsPanel';
import { format, parseISO } from 'date-fns';

const ClubAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [managedClubs, setManagedClubs] = useState<any[]>([]);
  const [memberClubs, setMemberClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'admin' | 'student'>('admin');
  
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalAuthorities: 0,
    upcomingEvents: 0,
    totalAnnouncements: 0,
    feesCollected: 0,
    isLoading: true,
  });

  const [members, setMembers] = useState<any[]>([]);
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);

  // Student view data (for clubs they're a member of)
  const [studentClubs, setStudentClubs] = useState<any[]>([]);
  const [studentEvents, setStudentEvents] = useState<any[]>([]);
  const [studentAnnouncements, setStudentAnnouncements] = useState<any[]>([]);
  const [studentStats, setStudentStats] = useState({
    clubsJoined: 0,
    upcomingEvents: 0,
    recentAnnouncements: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (user?.id) {
      loadManagedClubs();
    }
  }, [user?.id]);

  // Load student data after managed clubs are loaded
  useEffect(() => {
    if (user?.id && managedClubs.length >= 0) {
      loadStudentData();
    }
  }, [user?.id, managedClubs.length]);

  useEffect(() => {
    if (selectedClub?.id && activeTab === 'admin') {
      loadDashboardData();
    }
  }, [selectedClub?.id, activeTab]);

  // Load clubs where user is assigned as club admin (ADMIN role)
  const loadManagedClubs = async () => {
    try {
      // Get all authorities for the current user
      const authoritiesRes = await authorityApi.getAll().catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
      const allAuthorities = extractCollection<any>(authoritiesRes) || [];

      // Filter authorities where user is the club admin (ADMIN role)
      // Authority has studentId (the club admin) and clubId (the club they manage)
      // In backend, authority name 'ADMIN' means club admin role
      const userAuthorities = allAuthorities.filter((auth: any) => {
        const studentId = auth.student?.id || auth.studentId;
        const authName = (auth.name || '').toUpperCase();
        // Check if user is assigned as club admin (ADMIN role) for this club
        return studentId === user?.id && authName === 'ADMIN';
      });

      // Get unique club IDs
      const clubIds = [...new Set(userAuthorities.map((auth: any) => auth.club?.id || auth.clubId))].filter(Boolean);

      if (clubIds.length === 0) {
        // User is not a club admin, but might be a student
        setStats((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Fetch club details for each club ID
      const clubPromises = clubIds.map(async (clubId: number) => {
        try {
          const club = await clubApi.getById(clubId);
          return club;
        } catch {
          return null;
        }
      });

      const clubs = (await Promise.all(clubPromises)).filter(Boolean);
      setManagedClubs(clubs);

      // Auto-select first club if only one, or prompt selection
      if (clubs.length === 1) {
        setSelectedClub(clubs[0]);
      } else if (clubs.length > 1) {
        // For now, select the first club (can be enhanced to show club selector)
        setSelectedClub(clubs[0]);
      }
    } catch (error: any) {
      console.error('Failed to load managed clubs:', error);
      toast.error('Failed to load your clubs');
      setStats((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Load student data (clubs they're a member of)
  const loadStudentData = async () => {
    if (!user?.id) return;

    setStudentStats((prev) => ({ ...prev, isLoading: true }));

    try {
      // Get clubs where user is a member
      const clubsRes = await studentApi.getClubs(user.id).catch(() => []);
      const allClubs = Array.isArray(clubsRes) ? clubsRes : extractCollection<any>(clubsRes) || [];

      // Wait for managed clubs to load, then filter
      // Filter out clubs where user is admin (those are in managedClubs)
      const managedClubIds = managedClubs.map((mc) => mc.id);
      const memberClubs = allClubs.filter((club: any) => {
        const clubId = club.id || club.clubId;
        return clubId && !managedClubIds.includes(clubId);
      });

      const memberClubIds = memberClubs.map((club: any) => club.id || club.clubId).filter(Boolean);

      // Get events and announcements for member clubs
      const [eventsRes, announcementsRes] = await Promise.all([
        studentApi.getEvents(user.id).catch(() => []),
        announcementApi.getAll().catch(() => ({ _embedded: { announcementResponseDtoList: [] } })),
      ]);

      const allEvents = Array.isArray(eventsRes) ? eventsRes : extractCollection<any>(eventsRes) || [];
      const allAnnouncements = extractCollection<any>(announcementsRes) || [];

      // Filter events and announcements for member clubs only (exclude managed clubs)
      const memberEvents = allEvents.filter((event: any) => {
        const eventClubId = event.club?.id || event.clubId;
        return eventClubId && memberClubIds.includes(eventClubId);
      });

      const memberAnnouncements = allAnnouncements.filter((announcement: any) => {
        const annClubId = announcement.club?.id || announcement.clubId;
        return annClubId && memberClubIds.includes(annClubId);
      });

      // Get upcoming events
      const now = new Date();
      const upcomingEvents = memberEvents.filter((event: any) => {
        try {
          if (!event.startAt) return false;
          const eventDate = new Date(event.startAt);
          return eventDate > now;
        } catch {
          return false;
        }
      });

      setStudentClubs(memberClubs);
      setStudentEvents(memberEvents);
      setStudentAnnouncements(memberAnnouncements);

      setStudentStats({
        clubsJoined: memberClubs.length,
        upcomingEvents: upcomingEvents.length,
        recentAnnouncements: memberAnnouncements.length,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Failed to load student data:', error);
      setStudentStats((prev) => ({ ...prev, isLoading: false }));
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
        authoritiesRes,
        eventsRes,
        announcementsRes,
        feesRes,
      ] = await Promise.all([
        clubApi.getMembers(clubId).catch(() => ({ _embedded: { studentResponseDtoList: [] } })),
        authorityApi.getByClub(clubId).catch(() => ({ _embedded: { authorityResponseDtoList: [] } })),
        eventApi.getByClub(clubId).catch(() => ({ _embedded: { eventList: [] } })),
        announcementApi.getByClub(clubId).catch(() => ({ _embedded: { announcementResponseDtoList: [] } })),
        feeApi.getByClub(clubId).catch(() => ({ _embedded: { feeResponseDtoList: [] } })),
      ]);

      const membersList = extractCollection<any>(membersRes) || [];
      const authoritiesList = extractCollection<any>(authoritiesRes) || [];
      const eventsList = extractCollection<any>(eventsRes) || [];
      const announcementsList = extractCollection<any>(announcementsRes) || [];
      const feesList = extractCollection<any>(feesRes) || [];

      setMembers(membersList);
      setAuthorities(authoritiesList);
      setEvents(eventsList);
      setAnnouncements(announcementsList);
      setFees(feesList);

      // Calculate upcoming events (events after today)
      const now = new Date();
      const upcomingEventsCount = eventsList.filter((event: any) => {
        try {
          if (!event.startAt) return false;
          const eventDate = new Date(event.startAt);
          return eventDate > now;
        } catch {
          return false;
        }
      }).length;

      // Calculate total fees collected
      const totalFees = feesList.reduce((sum: number, fee: any) => {
        return sum + (fee.amount || 0);
      }, 0);

      setStats({
        totalMembers: membersList.length,
        totalAuthorities: authoritiesList.length,
        upcomingEvents: upcomingEventsCount,
        totalAnnouncements: announcementsList.length,
        feesCollected: totalFees,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setStats((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Dashboard' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary animate-float" />
              Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              {managedClubs.length > 0
                ? `Club Admin & Student Dashboard`
                : 'Student Dashboard'}
            </p>
          </div>
        </div>

        {/* Club Selector (if managing multiple clubs) */}
        {managedClubs.length > 1 && activeTab === 'admin' && (
          <div className="flex items-center gap-2">
            <select
              value={selectedClub?.id || ''}
              onChange={(e) => {
                const club = managedClubs.find((c) => c.id === Number(e.target.value));
                setSelectedClub(club || null);
              }}
              className="glass-card border-primary/20 px-4 py-2 rounded-lg bg-background text-white"
            >
              {managedClubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.title || club.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="luxury-divider"></div>

      {/* Tabs for Admin View and Student View */}
      {managedClubs.length > 0 ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'admin' | 'student')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin" className="gap-2">
              <Building2 className="h-4 w-4" />
              Club Admin View
              {managedClubs.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                  {managedClubs.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="student" className="gap-2">
              <UsersIcon className="h-4 w-4" />
              Student View
              {studentStats.clubsJoined > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-success/20 text-success rounded-full">
                  {studentStats.clubsJoined}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Club Admin Tab */}
          <TabsContent value="admin" className="space-y-6">
            {!selectedClub ? (
              <Card className="glass-card border-primary/20">
                <CardContent className="p-12 text-center">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Club Assigned</h3>
                  <p className="text-muted-foreground">
                    You are not assigned as a club admin for any club yet. Please contact the system administrator.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Stats Cards */}
                <StatsCards stats={stats} isLoading={stats.isLoading} />

                {/* Charts Row */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                  <MemberGrowthChart members={members} isLoading={stats.isLoading} />
                  <EventsChart events={events} isLoading={stats.isLoading} />
                </div>

                {/* Fees Chart */}
                <FeesChart fees={fees} isLoading={stats.isLoading} />

                {/* Quick Actions & Recent Activity */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                  <QuickActionsPanel
                    clubId={selectedClub.id}
                    pendingRequestsCount={0} // Will be calculated when we implement join requests
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* Student Tab */}
          <TabsContent value="student" className="space-y-6">
            {/* Student Stats Cards */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
              <Card className="glass-card border-primary/20 glow-effect">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Clubs Joined
                  </CardTitle>
                  <div className="p-3 rounded-xl bg-success/10 shadow-sm">
                    <Building2 className="h-5 w-5 text-success" />
                  </div>
                </CardHeader>
                <CardContent>
                  {studentStats.isLoading ? (
                    <Skeleton className="h-8 w-20 mb-2" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold mb-1 neon-text text-white">
                        {studentStats.clubsJoined}
                      </div>
                      <p className="text-sm text-muted-foreground">Clubs you're a member of</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card border-primary/20 glow-effect">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Upcoming Events
                  </CardTitle>
                  <div className="p-3 rounded-xl bg-primary/10 shadow-sm">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  {studentStats.isLoading ? (
                    <Skeleton className="h-8 w-20 mb-2" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold mb-1 neon-text text-white">
                        {studentStats.upcomingEvents}
                      </div>
                      <p className="text-sm text-muted-foreground">Events in your clubs</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card border-primary/20 glow-effect">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Announcements
                  </CardTitle>
                  <div className="p-3 rounded-xl bg-info/10 shadow-sm">
                    <Bell className="h-5 w-5 text-info" />
                  </div>
                </CardHeader>
                <CardContent>
                  {studentStats.isLoading ? (
                    <Skeleton className="h-8 w-20 mb-2" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold mb-1 neon-text text-white">
                        {studentStats.recentAnnouncements}
                      </div>
                      <p className="text-sm text-muted-foreground">Recent announcements</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Student Clubs List */}
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl neon-text text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  My Clubs
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Clubs where you are a member
                </CardDescription>
              </CardHeader>
              <CardContent>
                {studentStats.isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : studentClubs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>You haven't joined any clubs yet</p>
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {studentClubs.map((club: any) => (
                      <Card
                        key={club.id}
                        className="glass-card border-primary/20 hover:bg-primary/10 transition-all cursor-pointer"
                        onClick={() => navigate(`/clubs`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">{club.title || club.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {club.description || 'No description'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl neon-text text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Events
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Events from your clubs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {studentStats.isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : studentEvents.filter((e: any) => {
                  try {
                    if (!e.startAt) return false;
                    return new Date(e.startAt) > new Date();
                  } catch {
                    return false;
                  }
                }).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentEvents
                      .filter((e: any) => {
                        try {
                          if (!e.startAt) return false;
                          return new Date(e.startAt) > new Date();
                        } catch {
                          return false;
                        }
                      })
                      .slice(0, 5)
                      .map((event: any) => (
                        <div
                          key={event.id}
                          className="glass-card p-4 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all cursor-pointer"
                          onClick={() => navigate('/events')}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">{event.title || 'Untitled Event'}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.club?.title || event.club?.name || 'Unknown Club'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {event.startAt ? format(parseISO(event.startAt), 'MMM dd, yyyy HH:mm') : 'No date'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // If not a club admin, show only student view
        <div className="space-y-6">
          {/* Student Stats Cards */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
            <Card className="glass-card border-primary/20 glow-effect">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Clubs Joined
                </CardTitle>
                <div className="p-3 rounded-xl bg-success/10 shadow-sm">
                  <Building2 className="h-5 w-5 text-success" />
                </div>
              </CardHeader>
              <CardContent>
                {studentStats.isLoading ? (
                  <Skeleton className="h-8 w-20 mb-2" />
                ) : (
                  <>
                    <div className="text-3xl font-bold mb-1 neon-text text-white">
                      {studentStats.clubsJoined}
                    </div>
                    <p className="text-sm text-muted-foreground">Clubs you're a member of</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 glow-effect">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Upcoming Events
                </CardTitle>
                <div className="p-3 rounded-xl bg-primary/10 shadow-sm">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                {studentStats.isLoading ? (
                  <Skeleton className="h-8 w-20 mb-2" />
                ) : (
                  <>
                    <div className="text-3xl font-bold mb-1 neon-text text-white">
                      {studentStats.upcomingEvents}
                    </div>
                    <p className="text-sm text-muted-foreground">Events in your clubs</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20 glow-effect">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Announcements
                </CardTitle>
                <div className="p-3 rounded-xl bg-info/10 shadow-sm">
                  <Bell className="h-5 w-5 text-info" />
                </div>
              </CardHeader>
              <CardContent>
                {studentStats.isLoading ? (
                  <Skeleton className="h-8 w-20 mb-2" />
                ) : (
                  <>
                    <div className="text-3xl font-bold mb-1 neon-text text-white">
                      {studentStats.recentAnnouncements}
                    </div>
                    <p className="text-sm text-muted-foreground">Recent announcements</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Student Clubs List */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl neon-text text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                My Clubs
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Clubs where you are a member
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentStats.isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : studentClubs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>You haven't joined any clubs yet</p>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {studentClubs.map((club: any) => (
                    <Card
                      key={club.id}
                      className="glass-card border-primary/20 hover:bg-primary/10 transition-all cursor-pointer"
                      onClick={() => navigate(`/clubs`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{club.title || club.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {club.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ClubAdminDashboard;
