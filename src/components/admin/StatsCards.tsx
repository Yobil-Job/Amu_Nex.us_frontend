import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Shield, Clock, Calendar, Bell, TrendingUp, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

interface StatCard {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  link?: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface StatsCardsProps {
  stats: {
    totalStudents: number;
    totalClubs: number;
    totalClubAdmins: number;
    totalPendingRequests: number;
    totalEvents: number;
    totalAnnouncements: number;
  };
  isLoading?: boolean;
}

const StatsCards = ({ stats, isLoading }: StatsCardsProps) => {
  const statCards: StatCard[] = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/students',
      description: 'Registered students',
    },
    {
      title: 'Total Clubs',
      value: stats.totalClubs,
      icon: Building2,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      link: '/clubs',
      description: 'Active clubs',
    },
    {
      title: 'Club Admins',
      value: stats.totalClubAdmins,
      icon: Shield,
      color: 'text-info',
      bgColor: 'bg-info/10',
      link: '/students',
      description: 'Active administrators',
    },
    {
      title: 'Pending Requests',
      value: stats.totalPendingRequests,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      link: '/clubs',
      description: 'Awaiting approval',
    },
    {
      title: 'Total Events',
      value: stats.totalEvents,
      icon: Calendar,
      color: 'text-success',
      bgColor: 'bg-success/10',
      link: '/events',
      description: 'System-wide events',
    },
    {
      title: 'Announcements',
      value: stats.totalAnnouncements,
      icon: Bell,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      link: '/announcements',
      description: 'System announcements',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="glass-card border-primary/20">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const CardWrapper = stat.link ? Link : 'div';
        const wrapperProps = stat.link ? { to: stat.link, className: 'block' } : { className: 'block' };

        return (
          <CardWrapper key={stat.title} {...wrapperProps}>
            <Card
              className="glass-card stat-card border-primary/20 animate-slide-up h-full glow-effect hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className={`p-3 rounded-xl ${stat.bgColor} shadow-sm animate-float`} style={{ animationDelay: `${index * 200}ms` }}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">
                  <span className="neon-text text-white">{stat.value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
                {stat.trend && (
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    <TrendingUp className={`h-3 w-3 ${stat.trend.isPositive ? 'text-success' : 'text-destructive'}`} />
                    <span className={stat.trend.isPositive ? 'text-success' : 'text-destructive'}>
                      {stat.trend.isPositive ? '+' : ''}{stat.trend.value}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </CardWrapper>
        );
      })}
    </div>
  );
};

export default StatsCards;

