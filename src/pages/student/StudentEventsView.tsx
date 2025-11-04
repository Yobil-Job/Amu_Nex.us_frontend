import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { studentApi, eventApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Calendar, Filter, Search, List, Calendar as CalendarIcon } from 'lucide-react';
import { parseISO, isAfter, isBefore } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import EventCard from '@/components/student/EventCard';
import EventDetailsDialog from '@/components/student/EventDetailsDialog';
import EventCalendarView from '@/components/student/EventCalendarView';

const STORAGE_KEY = 'student_event_interactions';

interface EventInteraction {
  eventId: number;
  isGoing: boolean;
  isInterested: boolean;
}

const StudentEventsView = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'past'>('all');
  const [filterClubId, setFilterClubId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [interactions, setInteractions] = useState<Record<number, EventInteraction>>({});

  useEffect(() => {
    if (user?.id) {
      loadData();
      loadInteractions();
    }
  }, [user?.id]);

  const loadInteractions = useCallback(() => {
    if (!user?.id) return;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        const interactionsMap: Record<number, EventInteraction> = {};
        const interactionsList: EventInteraction[] = JSON.parse(stored);
        interactionsList.forEach(interaction => {
          interactionsMap[interaction.eventId] = interaction;
        });
        setInteractions(interactionsMap);
      }
    } catch (error) {
      console.error('Failed to load interactions:', error);
    }
  }, [user?.id]);

  const saveInteractions = useCallback((interactionsMap: Record<number, EventInteraction>) => {
    if (!user?.id) return;
    try {
      const interactionsList = Object.values(interactionsMap);
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(interactionsList));
      setInteractions(interactionsMap);
    } catch (error) {
      console.error('Failed to save interactions:', error);
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // Try to load events from student's joined clubs
      const [studentEventsRes, joinedClubsRes] = await Promise.all([
        studentApi.getEvents(user.id).catch((err) => {
          console.warn('Failed to load student events:', err);
          // Don't show error if it's just a permission issue (403)
          if (err?.status === 403) {
            return [];
          }
          return [];
        }),
        studentApi.getClubs(user.id).catch((err) => {
          console.warn('Failed to load joined clubs:', err);
          return { _embedded: { responseClubDtoList: [] } };
        }),
      ]);

      // Handle different response formats
      const studentEvents = Array.isArray(studentEventsRes) 
        ? studentEventsRes.filter(e => e && e.id) 
        : [];
      
      const clubsList = extractCollection<any>(joinedClubsRes) || [];
      setJoinedClubs(clubsList);

      // Also load events from all clubs the student is in
      // Only process clubs with valid IDs
      const validClubs = clubsList.filter(club => club && club.id != null);
      const clubEventsPromises = validClubs.map(async (club) => {
        try {
          const response = await eventApi.getByClub(club.id);
          // Handle different response formats
          if (Array.isArray(response)) {
            return response.filter(e => e && e.id);
          }
          // Try HATEOAS format
          const eventsList = extractCollection<any>(response);
          return Array.isArray(eventsList) ? eventsList.filter(e => e && e.id) : [];
        } catch (err: any) {
          // Silently fail for individual clubs - might not have events or permission issues
          console.warn(`Failed to load events for club ${club.id}:`, err);
          return [];
        }
      });
      
      const clubEventsArrays = await Promise.all(clubEventsPromises);
      const clubEvents = clubEventsArrays.flat().filter(e => e && e.id);

      // Combine and deduplicate events by ID
      const allEventsList = [...studentEvents, ...clubEvents];
      const uniqueEvents = allEventsList.filter((event, index, self) =>
        event && event.id && index === self.findIndex(e => e && e.id === event.id)
      );

      setAllEvents(uniqueEvents);
      setEvents(uniqueEvents);
    } catch (error: any) {
      console.error('Failed to load events:', error);
      // Only show error if it's not a permission issue
      if (error?.status !== 403) {
        toast.error('Failed to load events. Please try again.');
      }
      setEvents([]);
      setAllEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    // Filter out any null/undefined events
    let filtered = allEvents.filter(event => event && event.id);

    // Filter by type (upcoming/past)
    if (filterType === 'upcoming') {
      filtered = filtered.filter(event => {
        if (!event.startAt) return false;
        try {
          return isAfter(parseISO(event.startAt), new Date());
        } catch {
          return false;
        }
      });
    } else if (filterType === 'past') {
      filtered = filtered.filter(event => {
        if (!event.startAt) return true;
        try {
          return isBefore(parseISO(event.startAt), new Date());
        } catch {
          return false;
        }
      });
    }

    // Filter by club
    if (filterClubId !== 'all') {
      const clubIdNum = parseInt(filterClubId);
      if (!isNaN(clubIdNum)) {
        filtered = filtered.filter(event =>
          event.club && event.club.id === clubIdNum
        );
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => {
        const title = (event.title || '').toLowerCase();
        const description = (event.description || '').toLowerCase();
        const clubName = (event.club?.title || event.club?.name || '').toLowerCase();
        return title.includes(query) || description.includes(query) || clubName.includes(query);
      });
    }

    // Sort by date (upcoming first, then past)
    return filtered.sort((a, b) => {
      if (!a.startAt) return 1;
      if (!b.startAt) return -1;
      try {
        const dateA = parseISO(a.startAt);
        const dateB = parseISO(b.startAt);
        const now = new Date();
        if (isAfter(dateA, now) && isBefore(dateB, now)) return -1;
        if (isBefore(dateA, now) && isAfter(dateB, now)) return 1;
        return dateB.getTime() - dateA.getTime(); // Most recent first
      } catch {
        return 0;
      }
    });
  }, [allEvents, filterType, filterClubId, searchQuery]);

  const handleMarkGoing = (eventId: number) => {
    const currentInteraction = interactions[eventId] || { eventId, isGoing: false, isInterested: false };
    const newInteraction: EventInteraction = {
      ...currentInteraction,
      isGoing: !currentInteraction.isGoing,
      // If marking as going, also mark as interested
      isInterested: !currentInteraction.isGoing || currentInteraction.isInterested,
    };
    const updated = { ...interactions, [eventId]: newInteraction };
    saveInteractions(updated);
    toast.success(newInteraction.isGoing ? 'Marked as going!' : 'Removed from going');
  };

  const handleMarkInterested = (eventId: number) => {
    const currentInteraction = interactions[eventId] || { eventId, isGoing: false, isInterested: false };
    const newInteraction: EventInteraction = {
      ...currentInteraction,
      isInterested: !currentInteraction.isInterested,
      // If unmarking interested, also unmark going
      isGoing: currentInteraction.isInterested ? false : currentInteraction.isGoing,
    };
    const updated = { ...interactions, [eventId]: newInteraction };
    saveInteractions(updated);
    toast.success(newInteraction.isInterested ? 'Marked as interested!' : 'Removed from interested');
  };

  const openEventDetails = (event: any) => {
    setSelectedEvent(event);
    setIsDetailsDialogOpen(true);
  };

  const getInteraction = (eventId: number): EventInteraction => {
    return interactions[eventId] || { eventId, isGoing: false, isInterested: false };
  };

  const upcomingCount = useMemo(() =>
    allEvents.filter(e => {
      if (!e || !e.startAt) return false;
      try {
        return isAfter(parseISO(e.startAt), new Date());
      } catch {
        return false;
      }
    }).length,
    [allEvents]
  );

  const pastCount = useMemo(() =>
    allEvents.filter(e => {
      if (!e) return false;
      if (!e.startAt) return true;
      try {
        return isBefore(parseISO(e.startAt), new Date());
      } catch {
        return false;
      }
    }).length,
    [allEvents]
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight neon-text text-white">
            Events
          </h1>
          <p className="text-muted-foreground mt-1">
            View events from your joined clubs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {allEvents.length} {allEvents.length === 1 ? 'Event' : 'Events'}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events ({allEvents.length})</SelectItem>
                <SelectItem value="upcoming">Upcoming ({upcomingCount})</SelectItem>
                <SelectItem value="past">Past ({pastCount})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterClubId} onValueChange={setFilterClubId}>
              <SelectTrigger>
                <SelectValue placeholder="All Clubs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {joinedClubs.map((club) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.title || club.name || `Club ${club.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              List View
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar View
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Display */}
      {viewMode === 'list' ? (
        filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterClubId !== 'all' || filterType !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No events from your joined clubs yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => {
              const interaction = getInteraction(event.id);
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  onViewDetails={openEventDetails}
                  onMarkGoing={handleMarkGoing}
                  onMarkInterested={handleMarkInterested}
                  isGoing={interaction.isGoing}
                  isInterested={interaction.isInterested}
                />
              );
            })}
          </div>
        )
      ) : (
        <EventCalendarView
          events={filteredEvents}
          onEventClick={openEventDetails}
        />
      )}

      {/* Event Details Dialog */}
      <EventDetailsDialog
        event={selectedEvent}
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        onMarkGoing={handleMarkGoing}
        onMarkInterested={handleMarkInterested}
        isGoing={selectedEvent ? getInteraction(selectedEvent.id).isGoing : false}
        isInterested={selectedEvent ? getInteraction(selectedEvent.id).isInterested : false}
      />
    </div>
  );
};

export default StudentEventsView;
