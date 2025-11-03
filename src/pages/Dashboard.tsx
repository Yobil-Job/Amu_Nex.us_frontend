import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { studentApi, clubApi, eventApi } from '@/lib/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClubs: 0,
    totalEvents: 0,
    isLoading: true,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [studentsRes, clubsRes, eventsRes] = await Promise.all([
        studentApi.getAll().catch(() => ({ _embedded: { studentResponseDtoList: [] } })),
        clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } })),
        eventApi.getAll().catch(() => ({ _embedded: { eventList: [] } })),
      ]);

      setStats({
        totalStudents: studentsRes?._embedded?.studentResponseDtoList?.length || 0,
        totalClubs: clubsRes?._embedded?.responseClubDtoList?.length || 0,
        totalEvents: eventsRes?._embedded?.eventList?.length || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      description: 'Registered students',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Clubs',
      value: stats.totalClubs,
      icon: Building2,
      description: 'Active clubs',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Total Events',
      value: stats.totalEvents,
      icon: Calendar,
      description: 'Scheduled events',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Welcome back! Here's an overview of your university club system.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.title} 
              className="card-hover border-primary/10 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
                <div className={`p-3 rounded-xl ${stat.bgColor} shadow-sm`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">
                  {stats.isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{stat.value}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/10 card-hover">
          <CardHeader>
            <CardTitle className="text-xl">Quick Stats</CardTitle>
            <CardDescription>System overview at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 transition-all hover:bg-primary/10">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-gradient-primary shadow-colored-primary animate-pulse"></div>
                <span className="text-sm font-medium">Students</span>
              </div>
              <span className="text-lg font-bold text-primary">{stats.totalStudents}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 transition-all hover:bg-accent/10">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-gradient-accent shadow-colored-accent animate-pulse"></div>
                <span className="text-sm font-medium">Clubs</span>
              </div>
              <span className="text-lg font-bold text-accent">{stats.totalClubs}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 transition-all hover:bg-success/10">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-gradient-success animate-pulse"></div>
                <span className="text-sm font-medium">Events</span>
              </div>
              <span className="text-lg font-bold text-success">{stats.totalEvents}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 card-hover bg-gradient-to-br from-success/5 to-primary/5">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              System Health
            </CardTitle>
            <CardDescription>Everything is running smoothly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse"></div>
              <span className="text-sm font-medium text-success-foreground">All systems operational</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The UniClub Management System is connected and ready to manage your university clubs,
              events, and student activities with ease.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
