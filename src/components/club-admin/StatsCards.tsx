import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Calendar, Bell, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  stats: {
    totalMembers: number;
    totalAuthorities: number;
    upcomingEvents: number;
    totalAnnouncements: number;
    feesCollected: number;
    isLoading: boolean;
  };
}

const StatsCards = ({ stats }: StatsCardsProps) => {
  const statCards = [
    {
      title: 'Total Members',
      value: stats.totalMembers,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      description: 'Club members',
    },
    {
      title: 'Authorities',
      value: stats.totalAuthorities,
      icon: Shield,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      description: 'Leadership roles',
    },
    {
      title: 'Upcoming Events',
      value: stats.upcomingEvents,
      icon: Calendar,
      color: 'text-success',
      bgColor: 'bg-success/10',
      description: 'Scheduled events',
    },
    {
      title: 'Announcements',
      value: stats.totalAnnouncements,
      icon: Bell,
      color: 'text-info',
      bgColor: 'bg-info/10',
      description: 'Total announcements',
    },
    {
      title: 'Fees Collected',
      value: `ETB ${stats.feesCollected.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      description: 'Total collected',
    },
  ];

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className={cn(
              'glass-card border-primary/20 glow-effect animate-slide-up',
              stat.bgColor
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className={cn('p-3 rounded-xl shadow-sm animate-float', stat.bgColor)} style={{ animationDelay: `${index * 200}ms` }}>
                <Icon className={cn('h-5 w-5', stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              {stats.isLoading ? (
                <>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold mb-1 neon-text text-white">
                    {stat.value}
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;

