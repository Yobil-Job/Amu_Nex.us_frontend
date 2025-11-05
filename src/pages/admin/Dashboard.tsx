import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { studentApi, clubApi, eventApi, announcementApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Activity, TrendingUp, Sparkles, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import StatsCards from '@/components/admin/StatsCards';
import StudentGrowthChart from '@/components/admin/StudentGrowthChart';
import TopClubsChart from '@/components/admin/TopClubsChart';
import EventsChart from '@/components/admin/EventsChart';
import QuickActionsPanel from '@/components/admin/QuickActionsPanel';
import { Skeleton } from '@/components/ui/skeleton';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClubs: 0,
    totalClubAdmins: 0,
    totalPendingRequests: 0,
    totalEvents: 0,
    totalAnnouncements: 0,
    isLoading: true,
  });

  const [students, setStudents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load all data in parallel
      const [studentsRes, clubsRes, eventsRes, announcementsRes] = await Promise.all([
        studentApi.getAll().catch(() => ({ _embedded: { studentResponseDtoList: [] } })),
        clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } })),
        eventApi.getAll().catch(() => ({ _embedded: { eventList: [] } })),
        announcementApi.getAll().catch(() => ({ _embedded: { announcementResponseDtoList: [] } })),
      ]);

      const studentsList = extractCollection<any>(studentsRes) || [];
      const clubsList = extractCollection<any>(clubsRes) || [];
      const eventsList = extractCollection<any>(eventsRes) || [];
      const announcementsList = extractCollection<any>(announcementsRes) || [];

      setStudents(studentsList);
      setClubs(clubsList);
      setEvents(eventsList);
      setAnnouncements(announcementsList);

      // Count club admins (students with role SUPER_USER)
      const clubAdminsCount = studentsList.filter((s: any) => s.role === 'SUPER_USER').length;

      // Load pending requests from all clubs
      let totalPendingRequests = 0;
      try {
        const pendingPromises = clubsList
          .filter((club: any) => club && club.id != null)
          .map(async (club: any) => {
            try {
              const response = await clubApi.getPendingRequests(club.id);
              const requests = extractCollection<any>(response) || [];
              return requests.length;
            } catch {
              return 0;
            }
          });
        const requestCounts = await Promise.all(pendingPromises);
        totalPendingRequests = requestCounts.reduce((sum, count) => sum + count, 0);
      } catch (error) {
        console.error('Failed to load pending requests:', error);
      }

      // Prepare recent activities
      const activities = [
        ...eventsList
          .filter((e: any) => e.startAt)
          .sort((a: any, b: any) => {
            try {
              return parseISO(b.startAt).getTime() - parseISO(a.startAt).getTime();
            } catch {
              return 0;
            }
          })
          .slice(0, 3)
          .map((e: any) => ({
            type: 'event',
            title: e.title || 'New Event',
            description: e.club?.title || e.club?.name || 'Event created',
            timestamp: e.startAt,
            icon: 'Calendar',
          })),
        ...announcementsList
          .sort((a: any, b: any) => {
            try {
              return parseISO(b.createdAt || b.id).getTime() - parseISO(a.createdAt || a.id).getTime();
            } catch {
              return 0;
            }
          })
          .slice(0, 3)
          .map((a: any) => ({
            type: 'announcement',
            title: a.title || 'New Announcement',
            description: a.club?.title || a.club?.name || 'Announcement created',
            timestamp: a.createdAt,
            icon: 'Bell',
          })),
      ]
        .sort((a, b) => {
          try {
            const dateA = a.timestamp ? parseISO(a.timestamp) : new Date(0);
            const dateB = b.timestamp ? parseISO(b.timestamp) : new Date(0);
            return dateB.getTime() - dateA.getTime();
          } catch {
            return 0;
          }
        })
        .slice(0, 5);

      setRecentActivities(activities);

      setStats({
        totalStudents: studentsList.length,
        totalClubs: clubsList.length,
        totalClubAdmins: clubAdminsCount,
        totalPendingRequests: totalPendingRequests,
        totalEvents: eventsList.length,
        totalAnnouncements: announcementsList.length,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setStats((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const systemHealth = useMemo(() => {
    const totalMetrics = 6;
    let healthyMetrics = 0;

    if (stats.totalStudents > 0) healthyMetrics++;
    if (stats.totalClubs > 0) healthyMetrics++;
    if (stats.totalClubAdmins > 0) healthyMetrics++;
    if (stats.totalEvents > 0) healthyMetrics++;
    if (stats.totalAnnouncements > 0) healthyMetrics++;
    // System is healthy if we have data
    if (!stats.isLoading) healthyMetrics++;

    const healthPercentage = (healthyMetrics / totalMetrics) * 100;
    
    if (healthPercentage >= 80) return { status: 'excellent', color: 'text-success', bg: 'bg-success/20', label: 'Excellent' };
    if (healthPercentage >= 60) return { status: 'good', color: 'text-primary', bg: 'bg-primary/20', label: 'Good' };
    if (healthPercentage >= 40) return { status: 'moderate', color: 'text-warning', bg: 'bg-warning/20', label: 'Moderate' };
    return { status: 'poor', color: 'text-destructive', bg: 'bg-destructive/20', label: 'Needs Attention' };
  }, [stats]);

  const upcomingEvents = useMemo(() => {
    return events
      .filter((e: any) => {
        if (!e.startAt) return false;
        try {
          return isAfter(parseISO(e.startAt), new Date());
        } catch {
          return false;
        }
      })
      .sort((a: any, b: any) => {
        try {
          return parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime();
        } catch {
          return 0;
        }
      })
      .slice(0, 5);
  }, [events]);

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary animate-float" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome back{user?.firstname ? `, ${user.firstname}` : ''}! System overview and analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${systemHealth.bg} ${systemHealth.color} border-primary/30 text-lg px-4 py-2`}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            System: {systemHealth.label}
          </Badge>
        </div>
      </div>
      <div className="luxury-divider"></div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={stats.isLoading} />

      {/* Charts Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <StudentGrowthChart students={students} isLoading={stats.isLoading} />
        <TopClubsChart clubs={clubs} events={events} isLoading={stats.isLoading} />
      </div>

      {/* Events Chart */}
      <EventsChart events={events} isLoading={stats.isLoading} />

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <QuickActionsPanel pendingRequestsCount={stats.totalPendingRequests} />

        {/* Recent Activity Feed */}
        <Card className="glass-card border-primary/20 glow-effect">
          <CardHeader>
            <CardTitle className="text-xl neon-text text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Latest system activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="glass-card p-3 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'event' ? 'bg-success/10' : 'bg-accent/10'
                      }`}>
                        {activity.type === 'event' ? (
                          <Clock className="h-4 w-4 text-success" />
                        ) : (
                          <Activity className="h-4 w-4 text-accent" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-white mb-1">
                          {activity.title}
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">
                          {activity.description}
                        </div>
                        {activity.timestamp && (
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Health Indicators */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl neon-text text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-info" />
            System Health
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Overall system status and metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card p-4 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Data Status</span>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.isLoading ? '...' : 'Active'}
              </div>
            </div>
            <div className="glass-card p-4 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Pending Actions</span>
                <AlertCircle className="h-4 w-4 text-warning" />
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.totalPendingRequests}
              </div>
            </div>
            <div className="glass-card p-4 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Upcoming Events</span>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div className="text-2xl font-bold text-white">
                {upcomingEvents.length}
              </div>
            </div>
            <div className="glass-card p-4 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">System Health</span>
                <div className={`h-2 w-2 rounded-full ${
                  systemHealth.status === 'excellent' ? 'bg-success' :
                  systemHealth.status === 'good' ? 'bg-primary' :
                  systemHealth.status === 'moderate' ? 'bg-warning' : 'bg-destructive'
                }`} />
              </div>
              <div className={`text-2xl font-bold ${systemHealth.color}`}>
                {systemHealth.label}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

