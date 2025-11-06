import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      action: () => navigate('/join-requests'),
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
      <CardContent>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                className={cn(
                  'glass-card h-auto p-6 flex flex-col items-start gap-3 transition-all hover:scale-105 border-2',
                  action.borderColor,
                  'hover:bg-primary/10 relative group'
                )}
                onClick={action.action}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={cn('p-3 rounded-xl shadow-sm', action.bgColor)}>
                  <Icon className={cn('h-6 w-6', action.color)} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-white mb-1 flex items-center justify-between gap-2">
                    <span>{action.title}</span>
                    {action.badge !== undefined && action.badge > 0 && (
                      <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2 break-words pr-8">
                    {action.description}
                  </div>
                </div>
                <ArrowRight className={cn('h-4 w-4 absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity', action.color)} />
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsPanel;

