import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import SystemLogsView from '@/components/admin/SystemLogsView';

const AdminSystemLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      // Note: This is a mock implementation
      // In a real system, you would fetch logs from a backend endpoint
      // For now, we'll generate mock logs based on recent activity
      
      // Simulate loading system logs
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Mock logs - in production, these would come from backend
      const mockLogs = [
        {
          id: 1,
          action: 'CREATE_CLUB',
          description: 'Created new club: Technology Club',
          user: { firstname: 'John', lastname: 'Doe' },
          timestamp: new Date().toISOString(),
          status: 'SUCCESS',
        },
        {
          id: 2,
          action: 'UPDATE_STUDENT',
          description: 'Updated student profile: Jane Smith',
          user: { firstname: 'Admin', lastname: 'User' },
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'SUCCESS',
        },
        {
          id: 3,
          action: 'DELETE_EVENT',
          description: 'Deleted event: Annual Sports Day',
          user: { firstname: 'Admin', lastname: 'User' },
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'SUCCESS',
        },
        {
          id: 4,
          action: 'APPROVE_REQUEST',
          description: 'Approved join request for Club: Arts Club',
          user: { firstname: 'Admin', lastname: 'User' },
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          status: 'SUCCESS',
        },
        {
          id: 5,
          action: 'ASSIGN_ROLE',
          description: 'Assigned SUPER_USER role to student',
          user: { firstname: 'Admin', lastname: 'User' },
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          status: 'SUCCESS',
        },
      ];

      setLogs(mockLogs);
    } catch (error: any) {
      console.error('Failed to load system logs:', error);
      toast.error('Failed to load system logs');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Activity className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              System Logs
            </h1>
            <p className="text-muted-foreground text-lg">
              View and monitor system activity and actions
            </p>
          </div>
        </div>
        <Button
          onClick={loadLogs}
          variant="outline"
          className="gap-2"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="luxury-divider"></div>

      {/* System Logs View */}
      <SystemLogsView logs={logs} isLoading={isLoading} />
    </div>
  );
};

export default AdminSystemLogs;

