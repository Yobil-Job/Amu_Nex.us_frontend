import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Calendar, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuickActionsPanelProps {
  clubId: number;
  pendingRequestsCount?: number;
}

const QuickActionsPanel = ({ clubId, pendingRequestsCount = 0 }: QuickActionsPanelProps) => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Create Announcement',
      description: 'Share updates with club members',
      icon: Bell,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
      action: () => navigate('/announcements'),
    },
    {
      title: 'Create Event',
      description: 'Schedule a new club event',
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
      action: () => navigate('/events'),
    },
    {
      title: 'Manage Requests',
      description: `${pendingRequestsCount} pending join request${pendingRequestsCount !== 1 ? 's' : ''}`,
      icon: Clock,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/30',
      action: () => navigate('/club-join-requests'),
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
  ];

  return (
    <Card className="glass-card border-primary/20 glow-effect">
      <CardHeader>
        <CardTitle className="text-xl neon-text text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          Quick Actions
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Frequently used actions for club management
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const handleClick = () => {
              console.log('Quick action clicked:', action.title);
              try {
                action.action();
              } catch (error) {
                console.error('Navigation error:', error);
              }
            };
            
            return (
              <div
                key={action.title}
                className="relative"
                style={{ zIndex: 10 }}
              >
                <button
                  type="button"
                  className={cn(
                    'glass-card h-auto p-6 flex flex-col items-start gap-3 transition-all hover:scale-105 border-2 rounded-lg',
                    'bg-background/50 backdrop-blur-sm',
                    action.borderColor,
                    'hover:bg-primary/10 relative group w-full cursor-pointer',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50',
                    'active:scale-[0.98]'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClick();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleClick();
                    }
                  }}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    position: 'relative',
                    zIndex: 10,
                    pointerEvents: 'auto'
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className={cn('p-3 rounded-xl shadow-sm flex-shrink-0', action.bgColor)} style={{ pointerEvents: 'none' }}>
                    <Icon className={cn('h-6 w-6', action.color)} />
                  </div>
                  <div className="text-left flex-1 w-full min-w-0" style={{ pointerEvents: 'none' }}>
                    <div className="font-semibold text-white mb-1 flex items-center justify-between gap-2">
                      <span className="truncate flex-1">{action.title}</span>
                      {action.badge !== undefined && action.badge > 0 && (
                        <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full flex-shrink-0">
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 break-words pr-6">
                      {action.description}
                    </div>
                  </div>
                  <ArrowRight 
                    className={cn('h-4 w-4 absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0', action.color)} 
                    style={{ pointerEvents: 'none' }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsPanel;

