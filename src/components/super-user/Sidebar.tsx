import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Users, Calendar, DollarSign, Bell, Package, 
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isSuperUser } from '@/lib/roles';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar = ({ isCollapsed = false, onToggle }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();

  if (!isSuperUser(user?.role)) {
    return null;
  }

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Members', href: '/members', icon: Users },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Finance', href: '/fees', icon: DollarSign },
    { name: 'Announcements', href: '/announcements', icon: Bell },
    { name: 'Resources', href: '/resources', icon: Package },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 h-screen bg-background/95 backdrop-blur-md border-r border-primary/20 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Toggle Button */}
        {onToggle && (
          <div className="flex justify-end p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-white',
                  isCollapsed && 'justify-center'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-primary')} />
                {!isCollapsed && (
                  <span className={cn('truncate', active && 'text-white')}>
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;

