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
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-colored-primary">
                <Building2 className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">UniClub</h1>
                <p className="text-xs text-muted-foreground font-medium">Management System</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} to={item.href}>
                    <Button
                      variant={isActive(item.href) ? 'default' : 'ghost'}
                      size="sm"
                      className={`gap-2 transition-all ${isActive(item.href) ? 'shadow-md' : ''}`}
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
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
