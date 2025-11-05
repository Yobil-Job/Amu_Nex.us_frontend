import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Clock, Plus, Settings, Shield, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsPanelProps {
  pendingRequestsCount?: number;
}

const QuickActionsPanel = ({ pendingRequestsCount = 0 }: QuickActionsPanelProps) => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Create Club',
      description: 'Add a new club to the system',
      icon: Building2,
      action: () => navigate('/clubs'),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      hoverColor: 'hover:bg-primary/20',
    },
    {
      title: 'Manage Users',
      description: 'View and manage all students',
      icon: Users,
      action: () => navigate('/students'),
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      hoverColor: 'hover:bg-accent/20',
    },
    {
      title: 'Pending Requests',
      description: `${pendingRequestsCount} requests awaiting approval`,
      icon: Clock,
      action: () => navigate('/clubs'),
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      hoverColor: 'hover:bg-warning/20',
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: Settings,
      action: () => navigate('/profile'),
      color: 'text-info',
      bgColor: 'bg-info/10',
      hoverColor: 'hover:bg-info/20',
    },
  ];

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl neon-text text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Frequently used administrative actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                className={`glass-card h-auto p-4 flex flex-col items-start transition-all hover:scale-105 border-primary/20 ${action.hoverColor} relative`}
                onClick={action.action}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`p-3 rounded-lg ${action.bgColor} animate-float flex-shrink-0 mb-3`} style={{ animationDelay: `${index * 150}ms` }}>
                  <Icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <div className="text-left w-full flex-1 min-w-0 pr-6">
                  <div className="font-semibold text-white mb-1.5 leading-tight">
                    {action.title}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {action.description}
                  </div>
                </div>
                {action.badge !== undefined && action.badge > 0 && (
                  <span className="absolute top-4 right-4 text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">
                    {action.badge}
                  </span>
                )}
                <ArrowRight className="h-4 w-4 text-muted-foreground absolute bottom-4 right-4" />
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsPanel;

