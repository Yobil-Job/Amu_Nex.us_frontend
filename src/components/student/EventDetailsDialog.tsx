import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Building2, ExternalLink, CheckCircle2, Heart } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { LocationPicker } from '@/components/LocationPicker';

interface EventDetailsDialogProps {
  event: any | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkGoing?: (eventId: number) => void;
  onMarkInterested?: (eventId: number) => void;
  isGoing?: boolean;
  isInterested?: boolean;
}

const EventDetailsDialog = ({
  event,
  isOpen,
  onClose,
  onMarkGoing,
  onMarkInterested,
  isGoing = false,
  isInterested = false,
}: EventDetailsDialogProps) => {
  if (!event || !event.id) return null;

  const isUpcoming = event?.startAt ? (() => {
    try {
      return isAfter(parseISO(event.startAt), new Date());
    } catch {
      return false;
    }
  })() : false;
  
  const hasLocation = event?.latitude != null && event?.longitude != null;
  const mapUrl = hasLocation
    ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{event.title || 'Untitled Event'}</DialogTitle>
              {event.club && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Building2 className="h-4 w-4" />
                  <span>{event.club.title || event.club.name || 'Unknown Club'}</span>
                </div>
              )}
            </div>
            <Badge variant={isUpcoming ? 'default' : 'secondary'}>
              {isUpcoming ? 'Upcoming' : 'Past'}
            </Badge>
          </div>
        </DialogHeader>

        <DialogDescription className="space-y-6">
          {/* Description */}
          {event.description && (
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {event?.startAt && (() => {
              try {
                return (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(event.startAt), 'EEEE, MMMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                );
              } catch {
                return null;
              }
            })()}
            {event?.startAt && event?.endAt && (() => {
              try {
                return (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Time</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(event.startAt), 'hh:mm a')} - {format(parseISO(event.endAt), 'hh:mm a')}
                      </p>
                    </div>
                  </div>
                );
              } catch {
                return null;
              }
            })()}
          </div>

          {/* Location */}
          {hasLocation && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Location</h4>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <LocationPicker
                  latitude={typeof event.latitude === 'number' ? event.latitude : parseFloat(event.latitude.toString())}
                  longitude={typeof event.longitude === 'number' ? event.longitude : parseFloat(event.longitude.toString())}
                  readOnly={true}
                />
              </div>
              {mapUrl && (
                <Button
                  variant="outline"
                  onClick={() => window.open(mapUrl, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Google Maps
                </Button>
              )}
            </div>
          )}

          {/* Actions for upcoming events */}
          {isUpcoming && (
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                variant={isGoing ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => {
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
                className="flex-1"
                onClick={() => {
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
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsDialog;
