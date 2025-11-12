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
    startDate?: string;
    date?: string;
    endAt?: string;
    endDate?: string;
    latitude?: number;
    lat?: number;
    longitude?: number;
    lng?: number;
    lon?: number;
    club?: {
      id: number;
      title?: string;
      name?: string;
    };
    clubId?: number;
    club_id?: number;
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
  // Robust date extraction
  const eventDateStr = event?.startAt || event?.startDate || event?.date;
  const isUpcoming = eventDateStr ? (() => {
    try {
      const date = parseISO(eventDateStr);
      if (isNaN(date.getTime())) {
        const fallbackDate = new Date(eventDateStr);
        if (isNaN(fallbackDate.getTime())) return false;
        return isAfter(fallbackDate, new Date());
      }
      return isAfter(date, new Date());
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
          {eventDateStr && (() => {
            try {
              const date = parseISO(eventDateStr);
              if (isNaN(date.getTime())) {
                const fallbackDate = new Date(eventDateStr);
                if (isNaN(fallbackDate.getTime())) return null;
                return (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(fallbackDate, 'MMM dd, yyyy')}
                    </span>
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(date, 'MMM dd, yyyy')}
                  </span>
                </div>
              );
            } catch {
              return null;
            }
          })()}
          {eventDateStr && (event?.endAt || event?.endDate) && (() => {
            try {
              const startDate = parseISO(eventDateStr);
              const endDateStr = event?.endAt || event?.endDate;
              const endDate = parseISO(endDateStr);
              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
              return (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(startDate, 'hh:mm a')} - {format(endDate, 'hh:mm a')}
                  </span>
                </div>
              );
            } catch {
              return null;
            }
          })()}
          {(() => {
            // Robust location extraction - check multiple possible field names
            const lat = event?.latitude || event?.lat || event?.location?.latitude || event?.location?.lat;
            const lng = event?.longitude || event?.lng || event?.lon || event?.location?.longitude || event?.location?.lng || event?.location?.lon;
            const hasLocation = lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng));
            
            if (!hasLocation) return null;
            
            const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
            
            return (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-primary hover:underline truncate"
                  style={{ pointerEvents: 'auto' }}
                >
                  View on Map
                </a>
              </div>
            );
          })()}
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
