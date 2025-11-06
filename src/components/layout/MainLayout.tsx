import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { 
  Menu, X, Users, Building2, Calendar, 
  DollarSign, Bell, Shield, Home, LogOut, UserCircle,
  Settings, Activity, UserCheck, ChevronDown
} from 'lucide-react';
import NotificationCenter, { type Notification } from '@/components/admin/NotificationCenter';
import { clubApi, eventApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getRoleDisplayName,
  getRoleBadgeColor,
  isSuperAdmin
} from '@/lib/roles';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Logo from '/logo.png';
import Footer from './Footer';

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  // Notifications state (only for SUPER_ADMIN)
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const STORAGE_KEY = 'admin_notifications';

  // Load notifications for SUPER_ADMIN
  useEffect(() => {
    if (isSuperAdmin(user?.role)) {
      loadNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      
      // Listen for notifications update events from other components
      const handleNotificationsUpdate = (event: CustomEvent) => {
        setNotifications(event.detail);
      };
      window.addEventListener('notificationsUpdated', handleNotificationsUpdate as EventListener);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('notificationsUpdated', handleNotificationsUpdate as EventListener);
      };
    }
  }, [user?.role]);

  const loadNotifications = async () => {
    try {
      // Load saved notifications from localStorage
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

      try {
        // Load data from backend
        const [clubsRes, eventsRes] = await Promise.all([
          clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } })),
          eventApi.getAll().catch(() => ({ _embedded: { eventList: [] } })),
        ]);

        const clubs = extractCollection<any>(clubsRes) || [];
        const events = extractCollection<any>(eventsRes) || [];

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
        // This is a mock notification for demonstration (only add if there are no suspicious notifications already)
        const hasSuspiciousActivity = savedNotifications.some((n) => n.type === 'suspicious_activity' && !n.read);
        if (!hasSuspiciousActivity && Math.random() > 0.7) { // 30% chance to show suspicious activity (for demo)
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
      } catch (error) {
        console.error('Failed to generate notifications:', error);
      }

      // Merge with saved notifications (keep existing ones that aren't duplicates)
      const existingIds = new Set(savedNotifications.map((n) => n.id));
      const newNotifications = generatedNotifications.filter((n) => !existingIds.has(n.id));
      
      const allNotifications = [...savedNotifications, ...newNotifications]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 100); // Keep last 100 notifications

      setNotifications(allNotifications);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotifications));
    } catch (error) {
      console.error('Failed to load notifications:', error);
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
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleViewAllNotifications = () => {
    navigate('/notifications');
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Define main navigation items (always visible for relevant roles)
  const mainNavigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['STUDENT', 'SUPER_USER', 'SUPER_ADMIN', 'ADMIN'] },
    { name: 'Clubs', href: '/clubs', icon: Building2, roles: ['STUDENT', 'SUPER_USER', 'SUPER_ADMIN', 'ADMIN'] },
    { name: 'Events', href: '/events', icon: Calendar, roles: ['STUDENT', 'SUPER_USER', 'SUPER_ADMIN', 'ADMIN'] },
    { name: 'Fees', href: '/fees', icon: DollarSign, roles: ['STUDENT', 'SUPER_USER', 'SUPER_ADMIN', 'ADMIN'] },
    { name: 'Announcements', href: '/announcements', icon: Bell, roles: ['STUDENT', 'SUPER_USER', 'SUPER_ADMIN', 'ADMIN'] },
  ];

  // Define admin navigation items (grouped in dropdown)
  const adminNavigationItems = [
    { name: 'Students', href: '/students', icon: Users, roles: ['SUPER_ADMIN'] },
    { name: 'Join Requests', href: '/join-requests', icon: UserCheck, roles: ['SUPER_ADMIN'] },
    { name: 'Members', href: '/club-members', icon: Users, roles: ['ADMIN'] },
    { name: 'Club Requests', href: '/club-join-requests', icon: UserCheck, roles: ['ADMIN'] },
    { name: 'Authorities', href: '/authorities', icon: Shield, roles: ['SUPER_ADMIN'] },
    { name: 'Authorities', href: '/club-authorities', icon: Shield, roles: ['ADMIN'] },
    { name: 'System Logs', href: '/system-logs', icon: Activity, roles: ['SUPER_ADMIN'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN'] },
  ];

  // Filter navigation items based on user role
  const mainNavigation = mainNavigationItems.filter(item => {
    if (!user?.role) return false;
    return item.roles.includes(user.role);
  });

  const adminNavigation = adminNavigationItems.filter(item => {
    if (!user?.role) return false;
    return item.roles.includes(user.role);
  });

  // Combine for mobile menu
  const allNavigation = [...mainNavigation, ...adminNavigation];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-primary/20 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity group">
              {/* Desktop Logo - Full Branding with Beautiful Rounded Frame */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  {/* Outer glow ring */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {/* Beautiful rounded frame with gradient border */}
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 backdrop-blur-md border-2 border-primary/40 group-hover:border-primary/60 transition-all duration-300 shadow-lg shadow-primary/20 group-hover:shadow-primary/30 overflow-hidden">
                    {/* Inner glow */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {/* Logo with rounded corners */}
                    <img 
                      src={Logo} 
                      alt="AMU NEX.US" 
                      className="relative z-10 h-12 w-12 object-contain rounded-lg p-1.5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                      style={{ filter: 'drop-shadow(0 2px 8px rgba(248, 181, 0, 0.3))' }}
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold neon-text text-white leading-tight">AMU NEX.US</h1>
                  <p className="text-xs text-muted-foreground font-medium leading-tight">Management System</p>
                </div>
              </div>
              {/* Mobile Logo - Compact with Beautiful Round Frame */}
              <div className="flex sm:hidden items-center gap-2">
                <div className="relative flex items-center justify-center">
                  {/* Outer glow */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {/* Beautiful circular frame */}
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 via-accent/10 to-primary/15 backdrop-blur-md border-2 border-primary/40 shadow-lg shadow-primary/20 overflow-hidden">
                    {/* Inner ring */}
                    <div className="absolute inset-1 rounded-full border border-primary/30"></div>
                    {/* Logo */}
                    <img 
                      src={Logo} 
                      alt="AMU NEX.US" 
                      className="relative z-10 h-8 w-8 object-contain rounded-md p-1 transition-transform duration-300 group-hover:scale-110"
                      style={{ filter: 'drop-shadow(0 1px 4px rgba(248, 181, 0, 0.4))' }}
                    />
                  </div>
                </div>
                <span className="text-base font-bold neon-text text-white">AMU NEX.US</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 flex-1 justify-center max-w-4xl">
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} to={item.href}>
                    <Button
                      variant={isActive(item.href) ? 'default' : 'ghost'}
                      size="sm"
                      className={`gap-2 transition-all ${
                        isActive(item.href) 
                          ? 'purple-gold-gradient text-white shadow-colored-primary hover:scale-105' 
                          : 'glass-card border-primary/20 hover:bg-primary/10 text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
              
              {/* Admin Menu Dropdown */}
              {adminNavigation.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={isActive('/settings') || isActive('/system-logs') || isActive('/students') || isActive('/join-requests') || isActive('/authorities') || isActive('/club-authorities') || isActive('/club-members') || isActive('/club-join-requests') ? 'default' : 'ghost'}
                      size="sm"
                      className={`gap-2 transition-all ${
                        isActive('/settings') || isActive('/system-logs') || isActive('/students') || isActive('/join-requests') || isActive('/authorities') || isActive('/club-authorities') || isActive('/club-members') || isActive('/club-join-requests')
                          ? 'purple-gold-gradient text-white shadow-colored-primary hover:scale-105' 
                          : 'glass-card border-primary/20 hover:bg-primary/10 text-white'
                      }`}
                    >
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">Admin</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 glass-card border-primary/20 bg-background/95 backdrop-blur-md">
                    <DropdownMenuLabel className="text-white font-semibold">Administration</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-primary/20" />
                    {adminNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem 
                          key={item.name} 
                          asChild
                          className="text-white focus:text-white focus:bg-primary/20 cursor-pointer"
                        >
                          <Link to={item.href} className="flex items-center gap-2 text-white hover:text-white focus:text-white">
                            <Icon className="h-4 w-4 text-white" />
                            <span className="text-white">{item.name}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2">
                {/* Notification Center (SUPER_ADMIN only) */}
                {isSuperAdmin(user?.role) && (
                  <NotificationCenter
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onNotificationClick={handleNotificationClick}
                    onViewAll={handleViewAllNotifications}
                  />
                )}
                
                {user?.role && (
                  <Badge className={getRoleBadgeColor(user.role)} variant="secondary">
                    {getRoleDisplayName(user.role)}
                  </Badge>
                )}
                
                {/* User Menu Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <UserCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{user?.firstname || 'User'}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 glass-card border-primary/20 bg-background/95 backdrop-blur-md">
                    <DropdownMenuLabel className="text-white font-semibold">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-white">
                          {user?.firstname} {user?.lastname}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-primary/20" />
                    <DropdownMenuItem 
                      asChild
                      className="text-white focus:text-white focus:bg-primary/20 cursor-pointer"
                    >
                      <Link to="/profile" className="flex items-center gap-2 text-white hover:text-white focus:text-white">
                        <UserCircle className="h-4 w-4 text-white" />
                        <span className="text-white">Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive hover:text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <nav className="mt-4 flex flex-col gap-1 pb-4 md:hidden">
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive(item.href) ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
              
              {adminNavigation.length > 0 && (
                <>
                  <div className="mt-2 pt-2 border-t border-primary/20">
                    <p className="text-xs text-muted-foreground px-3 py-1 font-semibold">ADMINISTRATION</p>
                  </div>
                  {adminNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Button
                          variant={isActive(item.href) ? 'default' : 'ghost'}
                          size="sm"
                          className="w-full justify-start gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {item.name}
                        </Button>
                      </Link>
                    );
                  })}
                </>
              )}
              
              <div className="mt-4 border-t border-primary/20 pt-4 space-y-2">
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full justify-start gap-2 text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 min-h-[calc(100vh-80px)]">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
