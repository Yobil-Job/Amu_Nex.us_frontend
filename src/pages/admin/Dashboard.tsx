import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { studentApi, clubApi, eventApi, announcementApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Activity, TrendingUp, Sparkles, AlertCircle, CheckCircle2, Clock, Building2 } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { toast } from 'sonner';
import StatsCards from '@/components/admin/StatsCards';
import StudentGrowthChart from '@/components/admin/StudentGrowthChart';
import TopClubsChart from '@/components/admin/TopClubsChart';
import EventsChart from '@/components/admin/EventsChart';
import QuickActionsPanel from '@/components/admin/QuickActionsPanel';
import NotificationsPanel from '@/components/admin/NotificationsPanel';
import { Skeleton } from '@/components/ui/skeleton';
import type { Notification } from '@/components/admin/NotificationCenter';
import Breadcrumbs from '@/components/admin/Breadcrumbs';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const STORAGE_KEY = 'admin_notifications';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setStats((prev) => ({ ...prev, isLoading: true }));
      
      // Load all data in parallel
      const [studentsRes, clubsRes, eventsRes, announcementsRes] = await Promise.all([
        studentApi.getAll().catch((error) => {
          console.error('Failed to load students:', error);
          return { _embedded: { studentResponseDtoList: [] } };
        }),
        clubApi.getAll().catch((error) => {
          console.error('Failed to load clubs:', error);
          return { _embedded: { responseClubDtoList: [] } };
        }),
        eventApi.getAll().catch((error) => {
          console.error('Failed to load events:', error);
          return { _embedded: { eventList: [] } };
        }),
        announcementApi.getAll().catch((error) => {
          console.error('Failed to load announcements:', error);
          // Announcement endpoint might return different structure
          return { _embedded: { announcementResponseDtoList: [] } };
        }),
      ]);

      const studentsList = extractCollection<any>(studentsRes) || [];
      const clubsList = extractCollection<any>(clubsRes) || [];
      const eventsList = extractCollection<any>(eventsRes) || [];
      
      // Handle announcements - Spring HATEOAS wraps in CollectionModel<EntityModel<Announcement>>
      // The backend returns CollectionModel which has _embedded with collection
      let announcementsList = extractCollection<any>(announcementsRes) || [];
      
      // If announcements response is a CollectionModel but extractCollection didn't find it,
      // try to extract from _embedded manually
      if (announcementsList.length === 0 && announcementsRes && announcementsRes._embedded) {
        // Try all possible keys in _embedded
        const embedded = announcementsRes._embedded;
        for (const key in embedded) {
          if (Array.isArray(embedded[key])) {
            announcementsList = embedded[key];
            console.log(`Found announcements in _embedded.${key}:`, announcementsList.length);
            break;
          }
        }
      }
      
      // Log for debugging if still empty
      if (announcementsList.length === 0 && announcementsRes) {
        console.log('Announcements response structure:', {
          hasEmbedded: !!announcementsRes._embedded,
          embeddedKeys: announcementsRes._embedded ? Object.keys(announcementsRes._embedded) : [],
          fullResponse: announcementsRes
        });
      }

      setStudents(studentsList);
      setClubs(clubsList);
      setEvents(eventsList);
      setAnnouncements(announcementsList);

      // Count club admins - students with role ADMIN from students table
      // Role is now included in StudentResponseDto after backend fix
      const clubAdminsCount = studentsList.filter((student: any) => {
        const role = student.role;
        // Handle both "ADMIN" and "ROLE_ADMIN" formats (backend returns Role_enum.ADMIN)
        return role === 'ADMIN' || role === 'ROLE_ADMIN' || role?.toUpperCase() === 'ADMIN';
      }).length;

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

      // Prepare recent activities - combine all types and sort chronologically
      // Don't pre-sort by type, combine all first then sort by timestamp
      const allActivities = [
        ...eventsList
          .filter((e: any) => e.startAt || e.createdAt)
          .map((e: any) => ({
            type: 'event',
            title: e.title || 'New Event',
            description: e.club?.title || e.club?.name || 'Event created',
            timestamp: e.startAt || e.createdAt,
            icon: 'Calendar',
            id: e.id,
          })),
        ...announcementsList
          .filter((a: any) => a.createdAt || a.id)
          .map((a: any) => ({
            type: 'announcement',
            title: a.title || 'New Announcement',
            description: a.club?.title || a.club?.name || 'Announcement created',
            timestamp: a.createdAt || a.createdDate,
            icon: 'Bell',
            id: a.id,
          })),
        ...clubsList
          .filter((c: any) => c.createdAt || c.id)
          .map((c: any) => ({
            type: 'club',
            title: c.title || c.name || 'New Club',
            description: 'Club created',
            timestamp: c.createdAt || c.createdDate,
            icon: 'Building',
            id: c.id,
          })),
      ];
      
      // Sort all activities by timestamp (most recent first) - proper chronological order
      const activities = allActivities
        .sort((a, b) => {
          try {
            // If both have timestamps, compare them
            if (a.timestamp && b.timestamp) {
              const dateA = parseISO(a.timestamp);
              const dateB = parseISO(b.timestamp);
              if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                return dateB.getTime() - dateA.getTime(); // Most recent first
              }
            }
            // If one has timestamp and other doesn't, timestamp comes first
            if (a.timestamp && !b.timestamp) return -1;
            if (!a.timestamp && b.timestamp) return 1;
            // If neither has timestamp, use ID as fallback
            return (b.id || 0) - (a.id || 0);
          } catch {
            // Fallback to ID comparison
            return (b.id || 0) - (a.id || 0);
          }
        })
        .slice(0, 10); // Show top 10 most recent activities

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

      // Load notifications
      loadNotifications();
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      toast.error(error.message || 'Failed to load dashboard data. Please refresh the page.');
      setStats((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const loadNotifications = async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedNotifications: Notification[] = JSON.parse(saved);
        // Filter out mock "suspicious activity" notifications that may have been randomly generated
        // Only keep real notifications (club requests, join requests, new events)
        const realNotifications = savedNotifications.filter(
          (n) => n.type !== 'suspicious_activity'
        );
        setNotifications(realNotifications);
        // Update localStorage with filtered notifications to prevent re-adding them
        if (realNotifications.length !== savedNotifications.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(realNotifications));
        }
      }
    } catch {
      // Ignore parse errors
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      // Trigger update event for header
      window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: updated }));
      return updated;
    });
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      // Trigger update event for header
      window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: updated }));
      return updated;
    });
    toast.success('All notifications marked as read');
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      navigate(notification.link);
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
        // Try both startAt and startTime fields
        const eventDate = e.startAt || e.startTime;
        if (!eventDate) return false;
        try {
          const parsedDate = parseISO(eventDate);
          return !isNaN(parsedDate.getTime()) && isAfter(parsedDate, new Date());
        } catch {
          return false;
        }
      })
      .sort((a: any, b: any) => {
        try {
          const dateA = parseISO(a.startAt || a.startTime || '');
          const dateB = parseISO(b.startAt || b.startTime || '');
          return dateA.getTime() - dateB.getTime();
        } catch {
          return 0;
        }
      })
      .slice(0, 5);
  }, [events]);

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Dashboard' }]} />

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

      {/* Quick Actions & Notifications */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <QuickActionsPanel pendingRequestsCount={stats.totalPendingRequests} />

        {/* Notifications Panel */}
        <NotificationsPanel
          notifications={notifications}
          isLoading={false}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onNotificationClick={handleNotificationClick}
        />
      </div>

      {/* Recent Activity Feed */}
      <div className="grid gap-6 grid-cols-1">
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
                        ) : activity.type === 'club' ? (
                          <Building2 className="h-4 w-4 text-primary" />
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
            <div className="glass-card p-4 rounded-lg border border-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-primary/40 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Data Status</span>
                <CheckCircle2 className="h-4 w-4 text-success animate-pulse" />
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.isLoading ? '...' : 'Active'}
              </div>
            </div>
            <div className="glass-card p-4 rounded-lg border border-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-primary/40 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Pending Actions</span>
                <AlertCircle className="h-4 w-4 text-warning animate-pulse" />
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.totalPendingRequests}
              </div>
            </div>
            <div className="glass-card p-4 rounded-lg border border-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-primary/40 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Upcoming Events</span>
                <TrendingUp className="h-4 w-4 text-success animate-pulse" />
              </div>
              <div className="text-2xl font-bold text-white">
                {upcomingEvents.length}
              </div>
            </div>
            <div className="glass-card p-4 rounded-lg border border-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-primary/40 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">System Health</span>
                <div className={`h-2 w-2 rounded-full animate-pulse ${
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

