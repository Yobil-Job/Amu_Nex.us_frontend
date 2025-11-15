import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Newspaper, 
  Calendar, 
  DollarSign, 
  Package, 
  TrendingUp,
  ArrowRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface QuickAccessCardsProps {
  pendingRequestsCount?: number;
  pendingEventRequestsCount?: number;
  pendingFinanceRequestsCount?: number;
}

const QuickAccessCards = ({ 
  pendingRequestsCount = 0,
  pendingEventRequestsCount = 0,
  pendingFinanceRequestsCount = 0,
}: QuickAccessCardsProps) => {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'News',
      description: 'View and manage club news (Coming soon)',
      icon: Newspaper,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
      hoverColor: 'hover:bg-primary/20',
      action: () => {
        // Placeholder - backend will be implemented in the future
        toast.info('News feature will be available soon');
      },
    },
    {
      title: 'Manage Events',
      description: 'Create and manage club events',
      icon: Calendar,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
      hoverColor: 'hover:bg-success/20',
      action: () => navigate('/events'),
      badge: pendingEventRequestsCount > 0 ? pendingEventRequestsCount : undefined,
    },
    {
      title: 'Finance Summary',
      description: 'View income, expenses, and reports',
      icon: DollarSign,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
      hoverColor: 'hover:bg-warning/20',
      action: () => navigate('/fees'),
      badge: pendingFinanceRequestsCount > 0 ? pendingFinanceRequestsCount : undefined,
    },
    {
      title: 'Resource Requests',
      description: 'Manage club resources and requests',
      icon: Package,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/30',
      hoverColor: 'hover:bg-accent/20',
      action: () => navigate('/resources'),
    },
    {
      title: 'Club Performance Stats',
      description: 'View analytics and insights',
      icon: TrendingUp,
      color: 'text-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info/30',
      hoverColor: 'hover:bg-info/20',
      action: () => navigate('/reports'),
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Tooltip key={card.title}>
              <TooltipTrigger asChild>
                <Card
                  className={cn(
                    'glass-card border-2 cursor-pointer transition-all hover:scale-105 glow-effect group',
                    card.borderColor,
                    card.hoverColor
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={card.action}
                >
                  <CardContent className="p-6 flex flex-col items-start gap-3 relative">
                    <div className={cn('p-3 rounded-xl shadow-sm', card.bgColor)}>
                      <Icon className={cn('h-6 w-6', card.color)} />
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-white text-sm leading-tight">
                          {card.title}
                        </h3>
                        {card.badge !== undefined && card.badge > 0 && (
                          <Badge className="bg-destructive text-destructive-foreground text-xs">
                            {card.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {card.description}
                      </p>
                    </div>
                    <ArrowRight 
                      className={cn(
                        'h-4 w-4 absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity',
                        card.color
                      )} 
                    />
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="top" className="glass-card border-primary/20 bg-background/95 backdrop-blur-md">
                <p className="text-white">{card.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default QuickAccessCards;

