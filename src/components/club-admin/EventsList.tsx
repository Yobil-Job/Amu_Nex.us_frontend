import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Eye, Pencil, Trash2, Users } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/admin/EmptyState';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EventsListProps {
  events: any[];
  isLoading: boolean;
  onViewDetails: (event: any) => void;
  onEdit: (event: any) => void;
  onDelete: (event: any) => void;
  viewMode?: 'list' | 'cards';
}

const EventsList = ({
  events,
  isLoading,
  onViewDetails,
  onEdit,
  onDelete,
  viewMode = 'list',
}: EventsListProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      try {
        const date = new Date(dateString);
        return format(date, 'MMM dd, yyyy HH:mm');
      } catch {
        return dateString;
      }
    }
  };

  const getEventStatus = (event: any) => {
    if (!event.startAt) return { label: 'Unknown', variant: 'secondary' as const };
    
    try {
      const startDate = parseISO(event.startAt);
      const now = new Date();
      
      if (isBefore(startDate, now)) {
        return { label: 'Past', variant: 'secondary' as const };
      } else if (isAfter(startDate, now)) {
        return { label: 'Upcoming', variant: 'default' as const };
      } else {
        return { label: 'Today', variant: 'default' as const };
      }
    } catch {
      return { label: 'Unknown', variant: 'secondary' as const };
    }
  };

  // Real-time countdown timer state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute for countdown timers
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getTimeUntilEvent = (event: any) => {
    if (!event.startAt) return null;
    try {
      const startDate = parseISO(event.startAt);
      const diff = startDate.getTime() - currentTime.getTime();
      
      if (diff < 0) return null; // Past event
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <EmptyState
            icon={Calendar}
            title="No Events"
            description="No events have been created yet. Create your first event to get started."
          />
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'cards') {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const status = getEventStatus(event);
          const timeUntil = getTimeUntilEvent(event);
          
          return (
            <Card key={event.id} className="glass-card border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant={status.variant} className="text-xs">
                    {status.label}
                  </Badge>
                  {timeUntil && (
                    <Badge variant="outline" className="text-xs text-primary border-primary/30">
                      {timeUntil}
                    </Badge>
                  )}
                </div>
                
                <h3 className="font-semibold text-lg text-white mb-2 line-clamp-2">
                  {event.title || 'Untitled Event'}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {event.description || 'No description'}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(event.startAt)}</span>
                  </div>
                  {event.latitude && event.longitude && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Location set</span>
                    </div>
                  )}
                  {event.participationCount !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{event.participationCount || 0} participants</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(event)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(event)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(event)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // List view
  return (
    <Card className="glass-card border-primary/20">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/20">
                <th className="text-left p-4 text-white font-semibold">Event</th>
                <th className="text-left p-4 text-white font-semibold">Date & Time</th>
                <th className="text-left p-4 text-white font-semibold">Location</th>
                <th className="text-left p-4 text-white font-semibold">Participants</th>
                <th className="text-left p-4 text-white font-semibold">Status</th>
                <th className="text-right p-4 text-white font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const status = getEventStatus(event);
                const timeUntil = getTimeUntilEvent(event);
                
                return (
                  <tr
                    key={event.id}
                    className="border-b border-primary/20 hover:bg-primary/10 transition-colors"
                  >
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-white mb-1">
                          {event.title || 'Untitled Event'}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {event.description || 'No description'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-white">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm">{formatDate(event.startAt)}</div>
                          {timeUntil && (
                            <div className="text-xs text-primary">{timeUntil} remaining</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {event.latitude && event.longitude ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">Set</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not set</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-white">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{event.participationCount || 0}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(event)}
                          className="h-8 w-8 p-0 text-accent hover:text-accent hover:bg-accent/10"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(event)}
                          className="h-8 w-8 p-0 text-accent hover:text-accent hover:bg-accent/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(event)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsList;

