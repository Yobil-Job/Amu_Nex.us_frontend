import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clubApi, eventApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import NotificationsPanel from '@/components/admin/NotificationsPanel';
import type { Notification } from '@/components/admin/NotificationCenter';

const STORAGE_KEY = 'admin_notifications';

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    // Set up interval to refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      // Load data from backend
      const [clubsRes, eventsRes] = await Promise.all([
        clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } })),
        eventApi.getAll().catch(() => ({ _embedded: { eventList: [] } })),
      ]);

      const clubs = extractCollection<any>(clubsRes) || [];
      const events = extractCollection<any>(eventsRes) || [];

      // Try to load saved notifications from localStorage
      let savedNotifications: Notification[] = [];
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          savedNotifications = JSON.parse(saved);
        }
      } catch {
        // Ignore parse errors
      }

      // Generate notifications based on current data
      const generatedNotifications: Notification[] = [];

      // Check for pending join requests (from all clubs)
      for (const club of clubs) {
        try {
          const requestsRes = await clubApi.getPendingRequests(club.id).catch(() => ({ _embedded: { requestResponseDtoList: [] } }));
          const requests = extractCollection<any>(requestsRes) || [];
          
          if (requests.length > 0) {
            generatedNotifications.push({
              id: `join_request_${club.id}_${Date.now()}`,
              type: 'join_request',
              title: `${requests.length} Pending Join Request${requests.length > 1 ? 's' : ''}`,
              message: `${requests.length} student${requests.length > 1 ? 's' : ''} want${requests.length === 1 ? 's' : ''} to join ${club.title || club.name}`,
              timestamp: new Date().toISOString(),
              read: false,
              link: '/join-requests',
              metadata: { clubId: club.id, count: requests.length },
            });
          }
        } catch {
          // Ignore errors for individual clubs
        }
      }

      // Check for recent events (created in last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      
      const recentEvents = events.filter((event: any) => {
        try {
          const eventDate = new Date(event.createdAt || event.startAt);
          return eventDate > oneDayAgo;
        } catch {
          return false;
        }
      });

      if (recentEvents.length > 0) {
        generatedNotifications.push({
          id: `new_event_${Date.now()}`,
          type: 'new_event',
          title: `${recentEvents.length} New Event${recentEvents.length > 1 ? 's' : ''} Created`,
          message: `${recentEvents.length} new event${recentEvents.length > 1 ? 's' : ''} ${recentEvents.length > 1 ? 'have' : 'has'} been created in the last 24 hours`,
          timestamp: new Date().toISOString(),
          read: false,
          link: '/events',
          metadata: { count: recentEvents.length },
        });
      }

      // Add suspicious activity notification (placeholder - can be enhanced with real logic)
      // This is a mock notification for demonstration
      if (Math.random() > 0.8) { // 20% chance to show suspicious activity (for demo)
        generatedNotifications.push({
          id: `suspicious_activity_${Date.now()}`,
          type: 'suspicious_activity',
          title: 'Suspicious Activity Detected',
          message: 'Multiple failed login attempts detected from an unusual location',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          read: false,
          link: '/system-logs',
          metadata: { severity: 'medium' },
        });
      }

      // Merge with saved notifications (keep existing ones that aren't duplicates)
      const existingIds = new Set(savedNotifications.map((n) => n.id));
      const newNotifications = generatedNotifications.filter((n) => !existingIds.has(n.id));
      
      const allNotifications = [...savedNotifications, ...newNotifications]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 100); // Keep last 100 notifications

      setNotifications(allNotifications);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotifications));
      
      // Trigger a custom event to update the header notification center
      window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: allNotifications }));
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    toast.success('All notifications marked as read');
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Bell className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Notifications
            </h1>
            <p className="text-muted-foreground text-lg">
              View and manage all system notifications
            </p>
          </div>
        </div>
        <Button
          onClick={loadNotifications}
          variant="outline"
          className="gap-2"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="luxury-divider"></div>

      {/* Notifications Panel */}
      <NotificationsPanel
        notifications={notifications}
        isLoading={isLoading}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onNotificationClick={handleNotificationClick}
        onRefresh={loadNotifications}
      />
    </div>
  );
};

export default AdminNotifications;

