import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, User, Clock, Shield, Building2, Calendar, Bell, DollarSign, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

interface ActivityLogProps {
  logs: any[];
  adminId?: number;
  isLoading: boolean;
}

const ActivityLog = ({ logs, adminId, isLoading }: ActivityLogProps) => {
  const getActivityIcon = (action: string) => {
    const actionUpper = action.toUpperCase();
    if (actionUpper.includes('CLUB')) return <Building2 className="h-4 w-4" />;
    if (actionUpper.includes('EVENT')) return <Calendar className="h-4 w-4" />;
    if (actionUpper.includes('ANNOUNCEMENT')) return <Bell className="h-4 w-4" />;
    if (actionUpper.includes('FEE')) return <DollarSign className="h-4 w-4" />;
    if (actionUpper.includes('USER') || actionUpper.includes('STUDENT')) return <Users className="h-4 w-4" />;
    if (actionUpper.includes('ROLE') || actionUpper.includes('AUTHORITY')) return <Shield className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActivityColor = (action: string) => {
    const actionUpper = action.toUpperCase();
    if (actionUpper.includes('CREATE')) return 'text-success';
    if (actionUpper.includes('UPDATE') || actionUpper.includes('EDIT')) return 'text-primary';
    if (actionUpper.includes('DELETE')) return 'text-destructive';
    if (actionUpper.includes('APPROVE')) return 'text-success';
    if (actionUpper.includes('REJECT')) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy HH:mm:ss');
    } catch {
      try {
        const date = new Date(dateString);
        return format(date, 'MMM dd, yyyy HH:mm:ss');
      } catch {
        return dateString;
      }
    }
  };

  const filteredLogs = useMemo(() => {
    if (!adminId) return logs;
    return logs.filter((log) => log.adminId === adminId || log.createdBy === adminId);
  }, [logs, adminId]);

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Activity Log
          {adminId && (
            <Badge variant="secondary" className="ml-2">
              Filtered
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {adminId ? 'Activity log for this admin' : 'System-wide activity log'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No activity logs available</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
            {filteredLogs.map((log, index) => {
              const action = log.action || log.type || 'Unknown action';
              const Icon = getActivityIcon(action);
              const colorClass = getActivityColor(action);

              return (
                <div
                  key={log.id || index}
                  className="glass-card p-3 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-primary/10 ${colorClass} flex-shrink-0`}>
                      {Icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold text-sm ${colorClass}`}>
                          {action}
                        </span>
                        {log.status && (
                          <Badge variant="outline" className="text-xs">
                            {log.status}
                          </Badge>
                        )}
                      </div>
                      {log.description && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {log.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {log.user && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{log.user.firstname} {log.user.lastname}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(log.timestamp || log.createdAt || log.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLog;

