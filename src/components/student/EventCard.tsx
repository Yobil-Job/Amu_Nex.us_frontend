import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Building2, Heart, CheckCircle2 } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';

interface EventCardProps {
  event: {
    id: number;
    title?: string;
    description?: string;
    startAt?: string;
    endAt?: string;
    latitude?: number;
    longitude?: number;
    club?: {
      id: number;
      title?: string;
      name?: string;
    };
  };
  onViewDetails?: (event: any) => void;
  onMarkGoing?: (eventId: number) => void;
  onMarkInterested?: (eventId: number) => void;
  isGoing?: boolean;
  isInterested?: boolean;
}

const EventCard = ({
  event,
  onViewDetails,
  onMarkGoing,
  onMarkInterested,
  isGoing = false,
  isInterested = false,
}: EventCardProps) => {
  const isUpcoming = event?.startAt ? (() => {
    try {
      return isAfter(parseISO(event.startAt), new Date());
    } catch {
      return false;
    }
  })() : false;

  return (
    <Card
      className={`border-primary/20 hover:shadow-lg transition-all cursor-pointer ${
        isUpcoming ? 'border-l-4 border-l-success' : 'border-l-4 border-l-muted-foreground'
      }`}
      onClick={() => onViewDetails?.(event)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{event.title || 'Untitled Event'}</CardTitle>
            {event.club && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Building2 className="h-4 w-4" />
                <span>{event.club.title || event.club.name || 'Unknown Club'}</span>
              </div>
            )}
          </div>
          <Badge variant={isUpcoming ? 'default' : 'secondary'} className="ml-2">
            {isUpcoming ? 'Upcoming' : 'Past'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="space-y-2 text-sm">
          {event?.startAt && (() => {
            try {
              return (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(parseISO(event.startAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              );
            } catch {
              return null;
            }
          })()}
          {event?.startAt && event?.endAt && (() => {
            try {
              return (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(parseISO(event.startAt), 'hh:mm a')} - {format(parseISO(event.endAt), 'hh:mm a')}
                  </span>
                </div>
              );
            } catch {
              return null;
            }
          })()}
          {(event?.latitude != null && event?.longitude != null) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Location available</span>
            </div>
          )}
        </div>

        {isUpcoming && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant={isGoing ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onMarkGoing?.(event.id);
              }}
            >
              {isGoing ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Going
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  I'm Going
                </>
              )}
            </Button>
            <Button
              variant={isInterested ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onMarkInterested?.(event.id);
              }}
            >
              {isInterested ? (
                <>
                  <Heart className="h-4 w-4 mr-2 fill-current" />
                  Interested
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Interested
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCard;
