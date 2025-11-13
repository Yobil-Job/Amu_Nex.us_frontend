import { useState, useEffect, useMemo } from 'react';
import NotificationCenter, { Notification } from './NotificationCenter';
import { clubApi, eventApi, announcementApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'club_admin_notifications';

interface NotificationsPanelProps {
  managedClubIds: number[];
}

const NotificationsPanel = ({ managedClubIds }: NotificationsPanelProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (managedClubIds.length > 0) {
      loadNotifications();
      // Set up interval to refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [managedClubIds.join(',')]);

  const loadNotifications = async () => {
    if (managedClubIds.length === 0) return;

    setIsLoading(true);
    try {
      if (import.meta.env.DEV) {
        console.log('🔔 Loading notifications for clubs:', managedClubIds);
      }
      
      const allNotifications: Notification[] = [];

      // Load notifications for each managed club
      for (const clubId of managedClubIds) {
        try {
          // Check for pending join requests
          const requestsRes = await clubApi.getPendingRequests(clubId).catch(() => ({ _embedded: { requestResponseDtoList: [] } }));
          const requests = extractCollection<any>(requestsRes) || [];
          
          if (requests.length > 0) {
            // Get club name (use cached if available)
            let clubName = 'Club';
            try {
              const club = await clubApi.getById(clubId).catch(() => null);
              clubName = club?.title || club?.name || 'Club';
            } catch {
              // Use default if fetch fails
            }
            
            // Create stable ID based on club ID and request count
            const notificationId = `join_request_${clubId}_${requests.length}`;

            allNotifications.push({
              id: notificationId,
              type: 'join_request',
              title: `${requests.length} New Join Request${requests.length > 1 ? 's' : ''}`,
              message: `${requests.length} student${requests.length > 1 ? 's' : ''} want${requests.length === 1 ? 's' : ''} to join ${clubName}`,
              timestamp: new Date().toISOString(),
              read: false,
              link: '/club-admin/join-requests',
              metadata: { clubId, count: requests.length },
            });
          }

          // Check for upcoming events (next 7 days)
          const eventsRes = await eventApi.getByClub(clubId).catch(() => ({ _embedded: { eventList: [] } }));
          const events = extractCollection<any>(eventsRes) || [];
          
          const now = new Date();
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

          const upcomingEvents = events.filter((event: any) => {
            // Try multiple possible date fields
            const eventDateStr = event.startAt || event.startDate || event.date || event.scheduledAt || event.scheduled_at;
            if (!eventDateStr) return false;
            
            try {
              const eventDate = new Date(eventDateStr);
              if (isNaN(eventDate.getTime())) return false;
              return eventDate > now && eventDate <= sevenDaysFromNow;
            } catch {
              return false;
            }
          });

          if (upcomingEvents.length > 0) {
            let clubName = 'Club';
            try {
              const club = await clubApi.getById(clubId).catch(() => null);
              clubName = club?.title || club?.name || 'Club';
            } catch {
              // Use default if fetch fails
            }
            
            // Create stable ID based on club ID and upcoming events count
            const notificationId = `upcoming_event_${clubId}_${upcomingEvents.length}`;

            allNotifications.push({
              id: notificationId,
              type: 'upcoming_event',
              title: `${upcomingEvents.length} Upcoming Event${upcomingEvents.length > 1 ? 's' : ''}`,
              message: `${upcomingEvents.length} event${upcomingEvents.length > 1 ? 's' : ''} ${upcomingEvents.length > 1 ? 'are' : 'is'} coming up in the next 7 days for ${clubName}`,
              timestamp: new Date().toISOString(),
              read: false,
              link: '/club-admin/events',
              metadata: { clubId, count: upcomingEvents.length },
            });
          }

          // Check for recent announcements (last 24 hours)
          const announcementsRes = await announcementApi.getByClub(clubId).catch(() => ({ _embedded: { announcementResponseDtoList: [] } }));
          const announcements = extractCollection<any>(announcementsRes) || [];
          
          const oneDayAgo = new Date();
          oneDayAgo.setHours(oneDayAgo.getHours() - 24);

          const recentAnnouncements = announcements.filter((announcement: any) => {
            // Try multiple possible date fields
            const announcementDateStr = announcement.createdAt || announcement.created_at || announcement.date || announcement.postedAt || announcement.posted_at;
            if (!announcementDateStr) return false;
            
            try {
              const announcementDate = new Date(announcementDateStr);
              if (isNaN(announcementDate.getTime())) return false;
              return announcementDate > oneDayAgo;
            } catch {
              return false;
            }
          });

          if (recentAnnouncements.length > 0) {
            let clubName = 'Club';
            try {
              const club = await clubApi.getById(clubId).catch(() => null);
              clubName = club?.title || club?.name || 'Club';
            } catch {
              // Use default if fetch fails
            }
            
            // Create stable ID based on club ID and announcement count
            // Use the latest announcement's ID if available for more stability
            const latestAnnouncementId = recentAnnouncements[0]?.id || Date.now();
            const notificationId = `announcement_${clubId}_${latestAnnouncementId}`;

            allNotifications.push({
              id: notificationId,
              type: 'announcement',
              title: `New Announcement${recentAnnouncements.length > 1 ? 's' : ''}`,
              message: `${recentAnnouncements.length} new announcement${recentAnnouncements.length > 1 ? 's' : ''} from ${clubName}`,
              timestamp: new Date().toISOString(),
              read: false,
              link: '/club-admin/announcements',
              metadata: { clubId, count: recentAnnouncements.length },
            });
          }
        } catch (error) {
          // Ignore errors for individual clubs, continue with others
          console.error(`Error loading notifications for club ${clubId}:`, error);
        }
      }

      // Load saved notifications from localStorage and merge
      let savedNotifications: Notification[] = [];
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          savedNotifications = JSON.parse(saved);
        }
      } catch {
        // Ignore parse errors
      }

      // Merge: keep saved read notifications, update existing ones, add new unread ones
      const savedById = new Map(savedNotifications.map(n => [n.id, n]));
      const mergedNotifications: Notification[] = [];

      // Add/update notifications
      allNotifications.forEach(newNotif => {
        const existing = savedById.get(newNotif.id);
        if (existing) {
          // Keep existing notification but update timestamp if content changed
          const contentChanged = existing.message !== newNotif.message || existing.title !== newNotif.title;
          mergedNotifications.push({
            ...existing,
            timestamp: contentChanged ? newNotif.timestamp : existing.timestamp,
            metadata: newNotif.metadata || existing.metadata,
          });
        } else {
          // Add new notification
          mergedNotifications.push(newNotif);
        }
      });

      // Also keep saved notifications that are still relevant (not older than 7 days)
      savedNotifications.forEach(savedNotif => {
        const exists = allNotifications.some(n => n.id === savedNotif.id);
        if (!exists) {
          // Check if notification is still relevant (less than 7 days old)
          try {
            const date = new Date(savedNotif.timestamp);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            if (date > sevenDaysAgo) {
              mergedNotifications.push(savedNotif);
            }
          } catch {
            // Ignore invalid dates
          }
        }
      });

      // Sort by timestamp (newest first)
      mergedNotifications.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA;
      });

      if (import.meta.env.DEV) {
        console.log('🔔 Notifications loaded:', {
          total: mergedNotifications.length,
          unread: mergedNotifications.filter(n => !n.read).length,
          joinRequests: mergedNotifications.filter(n => n.type === 'join_request').length,
          events: mergedNotifications.filter(n => n.type === 'upcoming_event').length,
          announcements: mergedNotifications.filter(n => n.type === 'announcement').length,
        });
      }

      setNotifications(mergedNotifications);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedNotifications));
      } catch {
        // Ignore storage errors
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <NotificationCenter
      notifications={notifications.slice(0, 10)} // Show only latest 10 in dropdown
      unreadCount={unreadCount}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      onNotificationClick={handleNotificationClick}
      isLoading={isLoading}
    />
  );
};

export default NotificationsPanel;

