import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, RefreshCw, TrendingUp, Sparkles } from 'lucide-react';
import { eventApi, clubApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import EventsList from '@/components/admin/EventsList';
import EventFilters from '@/components/admin/EventFilters';
import EditEventDialog from '@/components/admin/EditEventDialog';
import DeleteEventDialog from '@/components/admin/DeleteEventDialog';
import EventCalendarView from '@/components/admin/EventCalendarView';
import EventParticipationStats from '@/components/admin/EventParticipationStats';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isToday, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { Building2, MapPin, Clock, Users } from 'lucide-react';

const AdminEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [clubFilter, setClubFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, clubsRes] = await Promise.all([
        eventApi.getAll().catch(() => ({ _embedded: { eventList: [] } })),
        clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } })),
      ]);

      const eventsList = extractCollection<any>(eventsRes);
      const clubsList = extractCollection<any>(clubsRes);

      setAllEvents(eventsList);
      setEvents(eventsList);
      setClubs(clubsList);
    } catch (error: any) {
      console.error('Failed to load events:', error);
      toast.error(error.message || 'Failed to load events');
      setEvents([]);
      setAllEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = [...allEvents];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((event) => {
        const title = (event.title || '').toLowerCase();
        const description = (event.description || '').toLowerCase();
        return title.includes(query) || description.includes(query);
      });
    }

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter((event) => {
        if (!event.startAt) return false;
        try {
          const startDate = parseISO(event.startAt);
          switch (timeFilter) {
            case 'today':
              return isToday(startDate);
            case 'upcoming':
              return isAfter(startDate, now);
            case 'past':
              return isBefore(startDate, now);
            default:
              return true;
          }
        } catch {
          return false;
        }
      });
    }

    // Club filter
    if (clubFilter !== 'all') {
      filtered = filtered.filter((event) => {
        const clubId = event.club?.id?.toString() || event.clubId?.toString() || '';
        return clubId === clubFilter;
      });
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((event) => {
        if (!event.startAt) return false;
        try {
          const eventDate = parseISO(event.startAt);
          const fromDate = startOfDay(new Date(dateFrom));
          return eventDate >= fromDate;
        } catch {
          return false;
        }
      });
    }

    if (dateTo) {
      filtered = filtered.filter((event) => {
        if (!event.startAt) return false;
        try {
          const eventDate = parseISO(event.startAt);
          const toDate = endOfDay(new Date(dateTo));
          return eventDate <= toDate;
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [allEvents, searchQuery, timeFilter, clubFilter, dateFrom, dateTo]);

  // Get upcoming university-wide events (events from multiple clubs)
  const upcomingUniversityWideEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter((event) => {
        if (!event.startAt) return false;
        try {
          const startDate = parseISO(event.startAt);
          return isAfter(startDate, now);
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        if (!a.startAt || !b.startAt) return 0;
        try {
          return parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime();
        } catch {
          return 0;
        }
      })
      .slice(0, 5);
  }, [filteredEvents]);

  const clearFilters = () => {
    setSearchQuery('');
    setTimeFilter('all');
    setClubFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const openEditDialog = (event: any) => {
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (event: any) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const openDetailsDialog = (event: any) => {
    setSelectedEvent(event);
    setIsDetailsDialogOpen(true);
  };

  const handleEditSuccess = () => {
    loadData();
  };

  const handleDeleteSuccess = () => {
    loadData();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Events' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Calendar className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Events Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage all events across all clubs
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            variant="outline"
            className="gap-2"
          >
            {viewMode === 'list' ? <Calendar className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            {viewMode === 'list' ? 'Calendar View' : 'List View'}
          </Button>
          <Button
            onClick={loadData}
            variant="outline"
            className="gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="luxury-divider"></div>

      {/* Participation Stats */}
      <EventParticipationStats events={allEvents} isLoading={isLoading} />

      {/* Upcoming University-Wide Events Highlight */}
      {upcomingUniversityWideEvents.length > 0 && (
        <Card className="glass-card border-primary/20 bg-gradient-to-r from-primary/10 to-transparent">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-warning" />
              Upcoming University-Wide Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {upcomingUniversityWideEvents.map((event) => {
                const club = event.club || {};
                return (
                  <div
                    key={event.id}
                    className="glass-card p-3 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all cursor-pointer"
                    onClick={() => openDetailsDialog(event)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-white mb-1">
                          {event.title || 'Untitled Event'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {club.title || club.name || 'Unknown Club'}
                        </div>
                      </div>
                      <Badge variant="default" className="text-xs">
                        Upcoming
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(event.startAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <EventFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        clubFilter={clubFilter}
        onClubFilterChange={setClubFilter}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        clubs={clubs}
        onClearFilters={clearFilters}
      />

      {/* View Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'calendar')}>
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <EventsList
            events={filteredEvents}
            isLoading={isLoading}
            onViewDetails={openDetailsDialog}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <EventCalendarView
            events={filteredEvents}
            isLoading={isLoading}
            onDateClick={(date) => {
              // Filter events for selected date
              const dateStr = format(date, 'yyyy-MM-dd');
              setDateFrom(dateStr);
              setDateTo(dateStr);
              setViewMode('list');
            }}
            onEventClick={openDetailsDialog}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <EditEventDialog
        event={selectedEvent}
        clubs={clubs}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={handleEditSuccess}
      />

      <DeleteEventDialog
        event={selectedEvent}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={handleDeleteSuccess}
      />

      {/* Event Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              {selectedEvent?.title || 'Event Details'}
            </DialogTitle>
            <DialogDescription>
              Complete event information
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="glass-card p-4 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-white mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.description || 'No description available'}
                </p>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="glass-card p-4 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-white">Start Time</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedEvent.startAt)}
                  </p>
                </div>

                {selectedEvent.endAt && (
                  <div className="glass-card p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-accent" />
                      <h3 className="font-semibold text-white">End Time</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedEvent.endAt)}
                    </p>
                  </div>
                )}
              </div>

              <div className="glass-card p-4 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-white">Club</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.club?.title || selectedEvent.club?.name || 'Unknown Club'}
                </p>
              </div>

              {(selectedEvent.latitude || selectedEvent.longitude) && (
                <div className="glass-card p-4 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-warning" />
                    <h3 className="font-semibold text-white">Location</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Latitude: {selectedEvent.latitude}, Longitude: {selectedEvent.longitude}
                  </p>
                </div>
              )}

              <div className="glass-card p-4 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-success" />
                  <h3 className="font-semibold text-white">Participation</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.participantCount || selectedEvent.participationCount || 0} participants
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEvents;

