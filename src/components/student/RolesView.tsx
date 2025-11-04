import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Shield, Calendar, Crown, Users, Award } from 'lucide-react';
import { format, isAfter } from 'date-fns';

interface Authority {
  id: number;
  name: string;
  club?: {
    id: number;
    title?: string;
    name?: string;
    club_Type?: string;
  };
  startDate?: string;
  endDate?: string;
}

interface RolesViewProps {
  authorities: Authority[];
  isLoading?: boolean;
}

const RolesView = ({ authorities, isLoading }: RolesViewProps) => {
  const getRoleIcon = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('president') || name.includes('chair')) {
      return <Crown className="h-5 w-5 text-accent" />;
    }
    if (name.includes('secretary')) {
      return <Shield className="h-5 w-5 text-primary" />;
    }
    if (name.includes('finance') || name.includes('treasurer')) {
      return <Award className="h-5 w-5 text-success" />;
    }
    if (name.includes('vice') || name.includes('deputy')) {
      return <Users className="h-5 w-5 text-blue-500" />;
    }
    return <Shield className="h-5 w-5 text-muted-foreground" />;
  };

  const getRoleBadgeColor = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('president') || name.includes('chair')) {
      return 'bg-accent/20 text-accent border-accent/30';
    }
    if (name.includes('secretary')) {
      return 'bg-primary/20 text-primary border-primary/30';
    }
    if (name.includes('finance') || name.includes('treasurer')) {
      return 'bg-success/20 text-success border-success/30';
    }
    return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
  };

  const isUpcoming = (authority: Authority) => {
    // Upcoming: startDate exists and is in the future
    if (!authority.startDate) return false;
    return isAfter(new Date(authority.startDate), new Date());
  };

  const isActive = (authority: Authority) => {
    // Active: not upcoming, and (no endDate OR endDate is in the future)
    if (isUpcoming(authority)) return false;
    if (!authority.endDate) return true;
    return isAfter(new Date(authority.endDate), new Date());
  };

  const isExpired = (authority: Authority) => {
    // Expired: not upcoming, and endDate exists and is in the past
    if (isUpcoming(authority)) return false;
    if (!authority.endDate) return false;
    return !isAfter(new Date(authority.endDate), new Date());
  };

  // Filter authorities into categories (upcoming takes precedence)
  const upcomingAuthorities = authorities.filter(isUpcoming);
  const activeAuthorities = authorities.filter(isActive);
  const expiredAuthorities = authorities.filter(isExpired);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading roles...</p>
        </CardContent>
      </Card>
    );
  }

  if (authorities.length === 0) {
    return (
      <Card className="border-primary/20">
        <CardContent className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Authority Roles</h3>
          <p className="text-muted-foreground">
            You don't have any authority roles assigned in clubs yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Roles */}
      {activeAuthorities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-success animate-pulse"></div>
            <h3 className="text-lg font-semibold">Active Roles</h3>
            <Badge variant="secondary" className="bg-success/20 text-success">
              {activeAuthorities.length}
            </Badge>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {activeAuthorities.map((authority) => (
              <Card
                key={authority.id}
                className="border-success/20 shadow-md hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(authority.name)}
                      <CardTitle className="text-lg">{authority.name}</CardTitle>
                    </div>
                    <Badge className={getRoleBadgeColor(authority.name)}>
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">
                      {authority.club?.title || authority.club?.name || 'Unknown Club'}
                    </span>
                  </div>
                  {authority.club?.club_Type && (
                    <Badge variant="outline" className="text-xs">
                      {authority.club.club_Type}
                    </Badge>
                  )}
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-2 border-t">
                    {authority.startDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Started: {format(new Date(authority.startDate), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {authority.endDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Ends: {format(new Date(authority.endDate), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Roles */}
      {upcomingAuthorities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-accent animate-pulse"></div>
            <h3 className="text-lg font-semibold">Upcoming Roles</h3>
            <Badge variant="secondary" className="bg-accent/20 text-accent">
              {upcomingAuthorities.length}
            </Badge>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {upcomingAuthorities.map((authority) => (
              <Card
                key={authority.id}
                className="border-accent/20 shadow-md hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(authority.name)}
                      <CardTitle className="text-lg">{authority.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="bg-accent/20 text-accent">
                      Upcoming
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">
                      {authority.club?.title || authority.club?.name || 'Unknown Club'}
                    </span>
                  </div>
                  {authority.startDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Starts: {format(new Date(authority.startDate), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Expired Roles */}
      {expiredAuthorities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
            <h3 className="text-lg font-semibold">Past Roles</h3>
            <Badge variant="secondary" className="bg-muted">
              {expiredAuthorities.length}
            </Badge>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {expiredAuthorities.map((authority) => (
              <Card
                key={authority.id}
                className="border-muted shadow-sm opacity-75"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(authority.name)}
                      <CardTitle className="text-lg">{authority.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="bg-muted">
                      Expired
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">
                      {authority.club?.title || authority.club?.name || 'Unknown Club'}
                    </span>
                  </div>
                  {authority.endDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Ended: {format(new Date(authority.endDate), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesView;
