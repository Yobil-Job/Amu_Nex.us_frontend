import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, Calendar, DollarSign, TrendingUp, Plus, Search, Clock, Activity } from 'lucide-react';
import { studentApi, clubApi, eventApi, announcementApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { useMemo } from 'react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClubs: 0,
    totalEvents: 0,
    totalAnnouncements: 0,
    isLoading: true,
  });

  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    userClubs: 0,
    userEvents: 0,
    isLoading: false,
  });

  useEffect(() => {
    loadStats();
    loadRecentActivities();
    if (user?.id) {
      loadUserStats();
    }
  }, [user?.id]);

  const loadStats = async () => {
    try {
      const [studentsRes, clubsRes, eventsRes, announcementsRes] = await Promise.all([
        studentApi.getAll().catch(() => ({ _embedded: { studentResponseDtoList: [] } })),
        clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } })),
        eventApi.getAll().catch(() => ({ _embedded: { eventList: [] } })),
        announcementApi.getAll().catch(() => ({ _embedded: { announcementResponseDtoList: [] } })),
      ]);

      // Use HATEOAS helper to extract collections
      const students = extractCollection<any>(studentsRes);
      const clubs = extractCollection<any>(clubsRes);
      const events = extractCollection<any>(eventsRes);
      const announcements = extractCollection<any>(announcementsRes);

      setStats({
        totalStudents: students.length,
        totalClubs: clubs.length,
        totalEvents: events.length,
        totalAnnouncements: announcements.length,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  const loadRecentActivities = async () => {
    try {
      const [eventsRes, announcementsRes] = await Promise.all([
        eventApi.getAll().catch(() => ({ _embedded: { eventList: [] } })),
        announcementApi.getAll().catch(() => ({ _embedded: { announcementResponseDtoList: [] } })),
      ]);

      const events = extractCollection<any>(eventsRes);
      const announcements = extractCollection<any>(announcementsRes);

      // Sort by date (most recent first) and take top 5
      const sortedEvents = events
        .filter((e: any) => e.startAt)
        .sort((a: any, b: any) => {
          const dateA = parseISO(a.startAt);
          const dateB = parseISO(b.startAt);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);

      const sortedAnnouncements = announcements
        .filter((a: any) => a.createdAt || a.id)
        .slice(0, 5);

      setRecentEvents(sortedEvents);
      setRecentAnnouncements(sortedAnnouncements);
    } catch (error) {
      console.error('Failed to load recent activities:', error);
    }
  };

  const loadUserStats = async () => {
    if (!user?.id) return;
    setUserStats(prev => ({ ...prev, isLoading: true }));
    try {
      const [clubsRes, eventsRes] = await Promise.all([
        studentApi.getClubs(user.id).catch(() => []),
        studentApi.getEvents(user.id).catch(() => []),
      ]);

      const clubs = Array.isArray(clubsRes) ? clubsRes : extractCollection<any>(clubsRes);
      const events = Array.isArray(eventsRes) ? eventsRes : extractCollection<any>(eventsRes);

      setUserStats({
        userClubs: clubs.length,
        userEvents: events.length,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load user stats:', error);
      setUserStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Chart data - Events by date (last 7 days)
  const eventsChartData = useMemo(() => {
    if (recentEvents.length === 0) return [];
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'MMM dd'),
        fullDate: date,
        count: 0,
      };
    });

    recentEvents.forEach((event: any) => {
      if (event.startAt) {
        const eventDate = parseISO(event.startAt);
        const dayIndex = last7Days.findIndex(d => {
          return d.fullDate.toDateString() === eventDate.toDateString();
        });
        if (dayIndex >= 0) {
          last7Days[dayIndex].count++;
        }
      }
    });

    return last7Days;
  }, [recentEvents]);

  // Chart data - Clubs distribution (top clubs by events)
  const clubsDistributionData = useMemo(() => {
    if (recentEvents.length === 0) return [];
    
    const clubCounts: Record<string, number> = {};
    recentEvents.forEach((event: any) => {
      const clubName = event.club?.title || event.club?.name || 'Unknown Club';
      clubCounts[clubName] = (clubCounts[clubName] || 0) + 1;
    });

    return Object.entries(clubCounts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [recentEvents]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      description: 'Registered students',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/students',
      visible: user?.role === 'SUPER_ADMIN',
    },
    {
      title: 'Total Clubs',
      value: stats.totalClubs,
      icon: Building2,
      description: 'Active clubs',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      link: '/clubs',
      visible: true,
    },
    {
      title: 'Total Events',
      value: stats.totalEvents,
      icon: Calendar,
      description: 'Scheduled events',
      color: 'text-success',
      bgColor: 'bg-success/10',
      link: '/events',
      visible: true,
    },
    {
      title: 'My Clubs',
      value: userStats.userClubs,
      icon: Building2,
      description: 'Clubs you joined',
      color: 'text-info',
      bgColor: 'bg-info/10',
      link: '/clubs',
      visible: user?.role === 'STUDENT' || user?.role === 'SUPER_USER',
    },
    {
      title: 'My Events',
      value: userStats.userEvents,
      icon: Calendar,
      description: 'Events you\'re attending',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      link: '/events',
      visible: user?.role === 'STUDENT' || user?.role === 'SUPER_USER',
    },
  ].filter(card => card.visible);

  const quickActions = [
    {
      title: 'Create Event',
      description: 'Schedule a new club event',
      icon: Plus,
      action: () => navigate('/events'),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      visible: user?.role !== 'STUDENT',
    },
    {
      title: 'New Announcement',
      description: 'Share an update with members',
      icon: Activity,
      action: () => navigate('/announcements'),
      color: 'text-success',
      bgColor: 'bg-success/10',
      visible: true,
    },
    {
      title: 'Record Fee',
      description: 'Record a new fee payment',
      icon: DollarSign,
      action: () => navigate('/fees'),
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      visible: user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN',
    },
    {
      title: 'Search Students',
      description: 'Find and manage students',
      icon: Search,
      action: () => navigate('/students'),
      color: 'text-info',
      bgColor: 'bg-info/10',
      visible: user?.role === 'SUPER_ADMIN',
    },
  ].filter(action => action.visible);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome back{user?.firstname ? `, ${user.firstname}` : ''}! Here's an overview of your university club system.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.link || '#'} className="block">
              <Card 
                className="card-hover border-primary/10 animate-slide-up h-full"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-3 rounded-xl ${stat.bgColor} shadow-sm`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">
                    {stats.isLoading || (userStats.isLoading && stat.title.includes('My')) ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {stat.value}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
          <CardDescription>Frequently used actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-primary/5 transition-all"
                  onClick={action.action}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`p-2 rounded-lg ${action.bgColor}`}>
                    <Icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Events Over Time Chart */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl">Events Over Time</CardTitle>
            <CardDescription>Events scheduled in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={eventsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No event data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clubs Distribution Chart */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl">Events by Club</CardTitle>
            <CardDescription>Top clubs by event count</CardDescription>
          </CardHeader>
          <CardContent>
            {clubsDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={clubsDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {clubsDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No club distribution data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Recent Events */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Events
            </CardTitle>
            <CardDescription>Latest scheduled events</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEvents.length > 0 ? (
              <div className="space-y-3">
                {recentEvents.map((event: any, index: number) => (
                  <div
                    key={event.id || index}
                    className="p-3 rounded-lg border border-border/50 hover:bg-primary/5 transition-all cursor-pointer"
                    onClick={() => navigate('/events')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{event.title || 'Untitled Event'}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {event.startAt ? format(parseISO(event.startAt), 'MMM dd, yyyy HH:mm') : 'No date'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {event.club?.title || event.club?.name || 'Unknown Club'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent events</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Announcements */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Announcements
            </CardTitle>
            <CardDescription>Latest club announcements</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAnnouncements.length > 0 ? (
              <div className="space-y-3">
                {recentAnnouncements.map((announcement: any, index: number) => (
                  <div
                    key={announcement.id || index}
                    className="p-3 rounded-lg border border-border/50 hover:bg-primary/5 transition-all cursor-pointer"
                    onClick={() => navigate('/announcements')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{announcement.title || 'Untitled Announcement'}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {announcement.description || 'No description'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {announcement.club?.title || announcement.club?.name || 'Unknown Club'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent announcements</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
