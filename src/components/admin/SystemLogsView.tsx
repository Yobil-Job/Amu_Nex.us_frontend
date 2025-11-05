import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Search, Filter, Clock, User, Shield } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SystemLogsViewProps {
  logs: any[];
  isLoading: boolean;
}

const SystemLogsView = ({ logs, isLoading }: SystemLogsViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const getActivityIcon = (action: string) => {
    const actionUpper = action.toUpperCase();
    if (actionUpper.includes('CLUB')) return '🏛️';
    if (actionUpper.includes('EVENT')) return '📅';
    if (actionUpper.includes('ANNOUNCEMENT')) return '📢';
    if (actionUpper.includes('FEE')) return '💰';
    if (actionUpper.includes('USER') || actionUpper.includes('STUDENT')) return '👤';
    if (actionUpper.includes('ROLE') || actionUpper.includes('AUTHORITY')) return '🛡️';
    return '⚡';
  };

  const getActivityColor = (action: string) => {
    const actionUpper = action.toUpperCase();
    if (actionUpper.includes('CREATE')) return 'bg-success/10 text-success border-success/30';
    if (actionUpper.includes('UPDATE') || actionUpper.includes('EDIT')) return 'bg-primary/10 text-primary border-primary/30';
    if (actionUpper.includes('DELETE')) return 'bg-destructive/10 text-destructive border-destructive/30';
    if (actionUpper.includes('APPROVE')) return 'bg-success/10 text-success border-success/30';
    if (actionUpper.includes('REJECT')) return 'bg-destructive/10 text-destructive border-destructive/30';
    return 'bg-muted/10 text-muted-foreground border-muted/30';
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
    let filtered = [...logs];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((log) => {
        const action = (log.action || log.type || '').toLowerCase();
        const description = (log.description || '').toLowerCase();
        const user = log.user ? `${log.user.firstname} ${log.user.lastname}`.toLowerCase() : '';
        return action.includes(query) || description.includes(query) || user.includes(query);
      });
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter((log) => {
        const action = (log.action || log.type || '').toUpperCase();
        return action.includes(actionFilter.toUpperCase());
      });
    }

    // Date filter (simplified - could be enhanced)
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter((log) => {
        const dateString = log.timestamp || log.createdAt || log.date;
        if (!dateString) return false;
        try {
          const logDate = parseISO(dateString);
          const diffDays = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
          
          switch (dateFilter) {
            case 'today':
              return diffDays === 0;
            case 'week':
              return diffDays <= 7;
            case 'month':
              return diffDays <= 30;
            default:
              return true;
          }
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [logs, searchQuery, actionFilter, dateFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setActionFilter('all');
    setDateFilter('all');
  };

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
          System Logs
        </CardTitle>
        <CardDescription>
          Last {filteredLogs.length} system actions and events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || actionFilter !== 'all' || dateFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}

          {/* Logs List */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No system logs found</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent">
              {filteredLogs.map((log, index) => {
                const action = log.action || log.type || 'Unknown action';
                const colorClass = getActivityColor(action);

                return (
                  <div
                    key={log.id || index}
                    className="glass-card p-3 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">
                        {getActivityIcon(action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge className={colorClass}>
                            {action}
                          </Badge>
                          {log.status && (
                            <Badge variant="outline" className="text-xs">
                              {log.status}
                            </Badge>
                          )}
                        </div>
                        {log.description && (
                          <p className="text-sm text-muted-foreground mb-2">
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
                          {log.admin && (
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              <span>Admin: {log.admin.firstname} {log.admin.lastname}</span>
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
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemLogsView;

