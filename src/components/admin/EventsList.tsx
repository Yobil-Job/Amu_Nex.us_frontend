import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Building2, MapPin, Clock, Eye, Pencil, Trash2, Users, MoreVertical } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
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
}

const EventsList = ({
  events,
  isLoading,
  onViewDetails,
  onEdit,
  onDelete,
}: EventsListProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return format(date, 'MMM dd, yyyy HH:mm');
      } catch {
        return dateString;
      }
    }
  };

  const getEventStatus = (event: any) => {
    // Check multiple possible date fields
    const startDateStr = event.startAt || event.startDate || event.date;
    if (!startDateStr) return { label: 'Unknown', variant: 'secondary' as const };
    
    try {
      const startDate = parseISO(startDateStr);
      const now = new Date();
      
      if (isBefore(startDate, now)) {
        return { label: 'Past', variant: 'secondary' as const };
      } else if (isAfter(startDate, now)) {
        return { label: 'Upcoming', variant: 'default' as const };
      } else {
        return { label: 'Today', variant: 'default' as const };
      }
    } catch {
      try {
        const startDate = new Date(startDateStr);
        if (isNaN(startDate.getTime())) return { label: 'Unknown', variant: 'secondary' as const };
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
        <CardContent className="p-12">
          <div className="text-center">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg">No events found</p>
            <p className="text-muted-foreground text-sm mt-2">
              Try adjusting your filters or check back later
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Participation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const status = getEventStatus(event);
                // Extract club data - check multiple possible locations
                const club = event.club || {};
                const clubName = club.title || club.name || `Club ${club.id || event.clubId || 'N/A'}`;
                
                return (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium text-white">
                            {event.title || 'Untitled Event'}
                          </div>
                          {event.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {event.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-accent" />
                        <span className="text-white">
                          {clubName}
                        </span>
                      </div>
                      {club.club_Type && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {club.club_Type}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <div className="text-white">
                            {formatDate(event.startAt || event.startDate || event.date)}
                          </div>
                          {(event.endAt || event.endDate) && (
                            <div className="text-xs text-muted-foreground">
                              Until {formatDate(event.endAt || event.endDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        // Extract location from various possible locations
                        const latitude = event.latitude || event.lat;
                        const longitude = event.longitude || event.lng || event.lon;
                        
                        if (latitude && longitude) {
                          return (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>Location set</span>
                            </div>
                          );
                        }
                        return <span className="text-xs text-muted-foreground">No location</span>;
                      })()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-white">
                          {event.participantCount || event.participationCount || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(event)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEdit(event)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(event)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsList;

