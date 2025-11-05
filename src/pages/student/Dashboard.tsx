import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { studentApi, eventApi, announcementApi, authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, Calendar, Bell, Shield, Activity, TrendingUp, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ClubsJoinedWidget from '@/components/student/ClubsJoinedWidget';
import UpcomingEventsWidget from '@/components/student/UpcomingEventsWidget';
import AnnouncementsWidget from '@/components/student/AnnouncementsWidget';
import RolesWidget from '@/components/student/RolesWidget';
import ActivityTimeline from '@/components/student/ActivityTimeline';
import ParticipationStatsWidget from '@/components/student/ParticipationStatsWidget';
import { addActivity } from '@/components/student/ActivityTimeline';

const STORAGE_KEY = 'student_read_announcements';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [clubs, setClubs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [readAnnouncements, setReadAnnouncements] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
      loadReadAnnouncements();
    }
  }, [user?.id]);

  const loadReadAnnouncements = useCallback(() => {
    if (!user?.id) return;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        const readIds: number[] = JSON.parse(stored);
        setReadAnnouncements(readIds);
      }
    } catch (error) {
      console.error('Failed to load read announcements:', error);
    }
  }, [user?.id]);

  const saveReadAnnouncements = useCallback((readIds: number[]) => {
    if (!user?.id) return;
    try {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(readIds));
      setReadAnnouncements(readIds);
    } catch (error) {
      console.error('Failed to save read announcements:', error);
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    
    try {
      // Load all data in parallel
      const [clubsRes, eventsRes, announcementsRes, authoritiesRes] = await Promise.all([
        studentApi.getClubs(user.id).catch(() => ({ _embedded: { responseClubDtoList: [] } })),
        studentApi.getEvents(user.id).catch(() => []),
        Promise.resolve([]), // Will load announcements from clubs
        authorityApi.getByStudent(user.id).catch(() => ({ _embedded: { authorityResponseDtoList: [] } })),
      ]);

      const clubsList = extractCollection<any>(clubsRes) || [];
      setClubs(clubsList);

      // Handle events
      const eventsList = Array.isArray(eventsRes) 
        ? eventsRes.filter(e => e && e.id) 
        : [];
      
      // Also load events from joined clubs
      const validClubs = clubsList.filter(club => club && club.id != null);
      const clubEventsPromises = validClubs.map(async (club) => {
        try {
          const response = await eventApi.getByClub(club.id);
          if (Array.isArray(response)) {
            return response.filter(e => e && e.id);
          }
          const eventsList = extractCollection<any>(response);
          return Array.isArray(eventsList) ? eventsList.filter(e => e && e.id) : [];
        } catch (err) {
          return [];
        }
      });
      
      const clubEventsArrays = await Promise.all(clubEventsPromises);
      const clubEvents = clubEventsArrays.flat().filter(e => e && e.id);
      const allEvents = [...eventsList, ...clubEvents];
      const uniqueEvents = allEvents.filter((event, index, self) =>
        event && event.id && index === self.findIndex(e => e && e.id === event.id)
      );
      setEvents(uniqueEvents);

      // Load announcements from joined clubs
      const announcementPromises = validClubs.map(async (club) => {
        try {
          const response = await announcementApi.getByClub(club.id);
          if (Array.isArray(response)) {
            return response.filter(ann => ann && ann.id).map(ann => ({
              ...ann,
              club: club,
            }));
          }
          const announcementsList = extractCollection<any>(response);
          return Array.isArray(announcementsList)
            ? announcementsList.filter(ann => ann && ann.id).map(ann => ({
                ...ann,
                club: club,
              }))
            : [];
        } catch (err) {
          return [];
        }
      });

      const announcementArrays = await Promise.all(announcementPromises);
      const allAnnouncementsList = announcementArrays.flat();
      const uniqueAnnouncements = allAnnouncementsList.filter((ann, index, self) =>
        ann && ann.id && index === self.findIndex(a => a && a.id === ann.id)
      );
      setAnnouncements(uniqueAnnouncements);

      // Handle authorities
      const authoritiesList = extractCollection<any>(authoritiesRes) || [];
      setAuthorities(authoritiesList);

      // Add activities
      if (clubsList.length > 0) {
        addActivity(
          'club_joined',
          `Joined ${clubsList.length} ${clubsList.length === 1 ? 'club' : 'clubs'}`,
          `You are a member of ${clubsList.map(c => c.title || c.name).join(', ')}`
        );
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAnnouncementAsRead = (id: number) => {
    if (readAnnouncements.includes(id)) return;
    const updated = [...readAnnouncements, id];
    saveReadAnnouncements(updated);
    addActivity(
      'announcement_read',
      'Read announcement',
      'Marked an announcement as read'
    );
  };

  const upcomingEventsCount = events.filter(e => {
    if (!e || !e.startAt) return false;
    try {
      const eventDate = new Date(e.startAt);
      return eventDate > new Date();
    } catch {
      return false;
    }
  }).length;

  const activeRolesCount = authorities.filter(auth => {
    if (!auth.startDate) return false;
    try {
      const startDate = new Date(auth.startDate);
      if (startDate > new Date()) return false;
      if (!auth.endDate) return true;
      return new Date(auth.endDate) > new Date();
    } catch {
      return false;
    }
  }).length;

  const unreadAnnouncementsCount = announcements.filter(
    ann => !readAnnouncements.includes(ann.id)
  ).length;

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary animate-float" />
            Student Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome back{user?.firstname ? `, ${user.firstname}` : ''}! Here's your overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {clubs.length} {clubs.length === 1 ? 'Club' : 'Clubs'}
          </Badge>
        </div>
      </div>
      <div className="luxury-divider"></div>

      {/* Quick Stats Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-primary/20 stat-card glow-effect hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Clubs Joined
            </CardTitle>
            <div className="p-3 rounded-xl bg-primary/10 shadow-sm animate-float">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                <span className="neon-text text-white">{clubs.length}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Active memberships</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-success/20 stat-card glow-effect hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Upcoming Events
            </CardTitle>
            <div className="p-3 rounded-xl bg-success/10 shadow-sm animate-float">
              <Calendar className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                <span className="neon-text text-white">{upcomingEventsCount}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Scheduled events</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-accent/20 stat-card glow-effect hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Announcements
            </CardTitle>
            <div className="p-3 rounded-xl bg-accent/10 shadow-sm animate-float">
              <Bell className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-3xl font-bold">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <span className="neon-text text-white">{announcements.length}</span>
                )}
              </div>
              {!isLoading && unreadAnnouncementsCount > 0 && (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  {unreadAnnouncementsCount} new
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Total announcements</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-info/20 stat-card glow-effect hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Active Roles
            </CardTitle>
            <div className="p-3 rounded-xl bg-info/10 shadow-sm animate-float">
              <Shield className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                <span className="neon-text text-white">{activeRolesCount}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Authority positions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Widgets Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Clubs Joined Widget */}
        <ClubsJoinedWidget
          clubsCount={clubs.length}
          clubs={clubs}
          isLoading={isLoading}
          onViewAll={() => navigate('/clubs')}
        />

        {/* Upcoming Events Widget */}
        <UpcomingEventsWidget
          events={events}
          isLoading={isLoading}
          onViewAll={() => navigate('/events')}
        />
      </div>

      {/* Second Row - Announcements and Roles */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Announcements Widget */}
        <AnnouncementsWidget
          announcements={announcements}
          isLoading={isLoading}
          readAnnouncements={readAnnouncements}
          onViewAll={() => navigate('/announcements')}
          onMarkAsRead={handleMarkAnnouncementAsRead}
        />

        {/* Roles Widget */}
        <RolesWidget
          authorities={authorities}
          isLoading={isLoading}
          onViewAll={() => navigate('/profile')}
        />
      </div>

      {/* Third Row - Stats and Activity */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Participation Stats Widget */}
        <ParticipationStatsWidget
          clubsCount={clubs.length}
          eventsCount={events.length}
          announcementsCount={announcements.length}
          rolesCount={activeRolesCount}
          isLoading={isLoading}
        />

        {/* Activity Timeline */}
        <ActivityTimeline userId={user?.id} isLoading={isLoading} />
      </div>

      {/* Quick Actions */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl neon-text text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Frequently used actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="glass-card h-auto p-4 flex flex-col items-start gap-2 hover:bg-primary/10 transition-all hover:scale-105 border-primary/20 hover:border-primary/40"
              onClick={() => navigate('/clubs')}
            >
              <div className="p-2 rounded-lg bg-primary/10 animate-float">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">Discover Clubs</div>
                <div className="text-xs text-muted-foreground">Find and join clubs</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="glass-card h-auto p-4 flex flex-col items-start gap-2 hover:bg-success/10 transition-all hover:scale-105 border-primary/20 hover:border-primary/40"
              onClick={() => navigate('/events')}
            >
              <div className="p-2 rounded-lg bg-success/10 animate-float">
                <Calendar className="h-5 w-5 text-success" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">View Events</div>
                <div className="text-xs text-muted-foreground">See all events</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="glass-card h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent/10 transition-all hover:scale-105 border-primary/20 hover:border-primary/40"
              onClick={() => navigate('/announcements')}
            >
              <div className="p-2 rounded-lg bg-accent/10 animate-float">
                <Bell className="h-5 w-5 text-accent" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">Announcements</div>
                <div className="text-xs text-muted-foreground">Latest updates</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="glass-card h-auto p-4 flex flex-col items-start gap-2 hover:bg-info/10 transition-all hover:scale-105 border-primary/20 hover:border-primary/40"
              onClick={() => navigate('/profile')}
            >
              <div className="p-2 rounded-lg bg-info/10 animate-float">
                <Shield className="h-5 w-5 text-info" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">My Profile</div>
                <div className="text-xs text-muted-foreground">View profile & roles</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;

