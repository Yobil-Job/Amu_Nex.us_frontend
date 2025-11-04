import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  Menu, X, Users, Building2, Calendar, 
  DollarSign, Bell, Shield, Home, LogOut, UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  canViewAllStudents, 
  canManageAuthorities,
  getRoleDisplayName,
  getRoleBadgeColor
} from '@/lib/roles';
import { Badge } from '@/components/ui/badge';
import Logo from '/logo.png';

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();

  // Define navigation items with role-based visibility
  const allNavigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['STUDENT', 'SUPER_USER', 'SUPER_ADMIN', 'ADMIN'] },
    { name: 'Students', href: '/students', icon: Users, roles: ['SUPER_ADMIN'] },
    { name: 'Clubs', href: '/clubs', icon: Building2, roles: ['STUDENT', 'SUPER_USER', 'SUPER_ADMIN', 'ADMIN'] },
    { name: 'Events', href: '/events', icon: Calendar, roles: ['STUDENT', 'SUPER_USER', 'SUPER_ADMIN', 'ADMIN'] },
    { name: 'Fees', href: '/fees', icon: DollarSign, roles: ['STUDENT', 'SUPER_USER', 'SUPER_ADMIN', 'ADMIN'] },
    { name: 'Announcements', href: '/announcements', icon: Bell, roles: ['STUDENT', 'SUPER_USER', 'SUPER_ADMIN', 'ADMIN'] },
    { name: 'Authorities', href: '/authorities', icon: Shield, roles: ['SUPER_ADMIN', 'ADMIN'] },
  ];

  // Filter navigation items based on user role
  const navigation = allNavigationItems.filter(item => {
    if (!user?.role) return false;
    return item.roles.includes(user.role);
  });

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
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 backdrop-blur-md border-2 border-primary/40 group-hover:border-primary/60 transition-all duration-300 shadow-lg shadow-primary/20 group-hover:shadow-primary/30 overflow-hidden">
                    {/* Inner glow */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {/* Logo with rounded corners */}
                    <img 
                      src={Logo} 
                      alt="AMU NEX.US" 
                      className="relative z-10 h-8 w-8 object-contain rounded-lg p-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
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
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 via-accent/10 to-primary/15 backdrop-blur-md border-2 border-primary/40 shadow-lg shadow-primary/20 overflow-hidden">
                    {/* Inner ring */}
                    <div className="absolute inset-1 rounded-full border border-primary/30"></div>
                    {/* Logo */}
                    <img 
                      src={Logo} 
                      alt="AMU NEX.US" 
                      className="relative z-10 h-6 w-6 object-contain rounded-md p-0.5 transition-transform duration-300 group-hover:scale-110"
                      style={{ filter: 'drop-shadow(0 1px 4px rgba(248, 181, 0, 0.4))' }}
                    />
                  </div>
                </div>
                <span className="text-base font-bold neon-text text-white">AMU NEX.US</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
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
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2">
                {user?.role && (
                  <Badge className={getRoleBadgeColor(user.role)} variant="secondary">
                    {getRoleDisplayName(user.role)}
                  </Badge>
                )}
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <UserCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{user?.firstname || 'User'}</span>
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
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
              {navigation.map((item) => {
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
              <div className="mt-4 border-t pt-4 space-y-2">
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={logout} 
                  className="w-full justify-start gap-2"
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
    </div>
  );
};

export default MainLayout;
