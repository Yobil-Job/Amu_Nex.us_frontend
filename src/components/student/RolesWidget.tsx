import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Building2, Calendar, Crown, Award, Users, ChevronRight, TrendingUp } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

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

interface RolesWidgetProps {
  authorities: Authority[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

const RolesWidget = ({ authorities, isLoading, onViewAll }: RolesWidgetProps) => {
  const navigate = useNavigate();

  const getRoleIcon = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('president') || name.includes('chair')) {
      return <Crown className="h-4 w-4 text-accent" />;
    }
    if (name.includes('secretary')) {
      return <Shield className="h-4 w-4 text-primary" />;
    }
    if (name.includes('finance') || name.includes('treasurer')) {
      return <Award className="h-4 w-4 text-success" />;
    }
    if (name.includes('vice') || name.includes('deputy')) {
      return <Users className="h-4 w-4 text-blue-500" />;
    }
    return <Shield className="h-4 w-4 text-muted-foreground" />;
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

  const isActive = (authority: Authority) => {
    if (!authority.startDate) return false;
    if (isAfter(new Date(authority.startDate), new Date())) return false;
    if (!authority.endDate) return true;
    return isAfter(new Date(authority.endDate), new Date());
  };

  const activeAuthorities = authorities.filter(isActive);
  const latestRoles = activeAuthorities.slice(0, 3);

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/profile');
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20 glow-effect h-full">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 glow-effect h-full hover:shadow-lg transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-info" />
            My Roles
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            {activeAuthorities.length} {activeAuthorities.length === 1 ? 'active role' : 'active roles'} assigned
          </CardDescription>
        </div>
        <div className="p-3 rounded-xl bg-info/10 shadow-sm animate-float">
          <Shield className="h-6 w-6 text-info" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeAuthorities.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-2">No authority roles assigned</p>
            <p className="text-xs text-muted-foreground">
              Get involved in club leadership!
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
              {latestRoles.map((authority) => (
                <div
                  key={authority.id}
                  className="glass-card p-3 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all cursor-pointer hover:scale-[1.01]"
                  onClick={() => navigate('/profile')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getRoleIcon(authority.name)}
                        <div className="font-semibold text-sm text-white truncate">
                          {authority.name}
                        </div>
                      </div>
                      {authority.club && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {authority.club.title || authority.club.name || 'Unknown Club'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getRoleBadgeColor(authority.name)}>
                          Active
                        </Badge>
                        {authority.startDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Since {format(new Date(authority.startDate), 'MMM yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>

            {activeAuthorities.length > 3 && (
              <div className="text-center text-sm text-muted-foreground pt-2 border-t border-primary/20">
                +{activeAuthorities.length - 3} more {activeAuthorities.length - 3 === 1 ? 'role' : 'roles'}
              </div>
            )}

            <div className="pt-3 border-t border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-white">
                    {activeAuthorities.length} Active
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-primary/20 hover:bg-primary/10"
                onClick={handleViewAll}
              >
                View All Roles
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RolesWidget;

