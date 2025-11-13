import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, Search, X, RefreshCw, List, Grid, Clock } from 'lucide-react';
import { eventApi, clubApi, authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { loadManagedClubsForUser } from '@/lib/clubAdminUtils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import EventsList from '@/components/club-admin/EventsList';
import CreateEventDialog from '@/components/club-admin/CreateEventDialog';
import EditEventDialog from '@/components/club-admin/EditEventDialog';
import DeleteEventDialog from '@/components/club-admin/DeleteEventDialog';
import EventCalendarView from '@/components/club-admin/EventCalendarView';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Users, Building2 } from 'lucide-react';

const ClubAdminEvents = () => {
  const { user } = useAuth();
  const [managedClubs, setManagedClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [displayMode, setDisplayMode] = useState<'list' | 'cards'>('list');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); // all, upcoming, past, today

  // Modals
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadManagedClubs();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClub?.id) {
      loadEvents();
    }
  }, [selectedClub?.id]);

  // Load clubs where user is assigned as club admin (ADMIN role)
  const loadManagedClubs = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const clubs = await loadManagedClubsForUser(user.id);

      if (clubs.length === 0) {
        toast.info('You are not assigned as a club admin for any club yet. Please contact the system administrator.');
        setIsLoading(false);
        return;
      }

      setManagedClubs(clubs);

      if (clubs.length === 1) {
        setSelectedClub(clubs[0]);
      } else if (clubs.length > 1) {
        setSelectedClub(clubs[0]);
      }
    } catch (error: any) {
      console.error('Failed to load managed clubs:', error);
      toast.error('Failed to load your clubs');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvents = async () => {
    if (!selectedClub?.id) return;

    setIsLoading(true);
    try {
      const eventsRes = await eventApi.getByClub(selectedClub.id).catch(() => ({ _embedded: { eventList: [] } }));
      const eventsList = extractCollection<any>(eventsRes) || [];
      
      // If participation count is not in the response, we can try to fetch it
      // For now, we'll use what's in the response (if available)
      // The backend may include participationCount in the event object
      
      setAllEvents(eventsList);
      setEvents(eventsList);
      
      if (import.meta.env.DEV) {
        console.log('📅 Events loaded:', {
          clubId: selectedClub.id,
          count: eventsList.length,
          sampleEvent: eventsList[0],
        });
      }
    } catch (error: any) {
      console.error('Failed to load events:', error);
      toast.error('Failed to load events');
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
      const now = startOfDay(new Date());
      filtered = filtered.filter((event) => {
        if (!event.startAt) return false;
        try {
          const eventDate = startOfDay(parseISO(event.startAt));
          if (timeFilter === 'upcoming') {
            return isAfter(eventDate, now);
          } else if (timeFilter === 'past') {
            return isBefore(eventDate, now);
          } else if (timeFilter === 'today') {
            return format(eventDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
          }
          return true;
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [allEvents, searchQuery, timeFilter]);

  // Event statistics
  const eventStats = useMemo(() => {
    const now = new Date();
    const upcoming = filteredEvents.filter((e) => {
      if (!e.startAt) return false;
      try {
        return isAfter(parseISO(e.startAt), now);
      } catch {
        return false;
      }
    }).length;
    const past = filteredEvents.filter((e) => {
      if (!e.startAt) return false;
      try {
        return isBefore(parseISO(e.startAt), now);
      } catch {
        return false;
      }
    }).length;
    return {
      total: filteredEvents.length,
      upcoming,
      past,
    };
  }, [filteredEvents]);

  const handleCreate = () => {
    setCreateDialogOpen(true);
  };

  const handleEdit = (event: any) => {
    setSelectedEvent(event);
    setEditDialogOpen(true);
  };

  const handleDelete = (event: any) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (event: any) => {
    setSelectedEvent(event);
    setDetailsDialogOpen(true);
  };

  const handleSuccess = () => {
    loadEvents();
  };

  const handleClose = () => {
    setSelectedEvent(null);
  };

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
              Events
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedClub
                ? `Manage events for ${selectedClub.title || selectedClub.name || 'Club'}`
                : 'Select a club to manage events'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedClub && (
            <Button
              variant="default"
              size="sm"
              onClick={handleCreate}
              className="gap-2 purple-gold-gradient"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadEvents}
            disabled={isLoading || !selectedClub}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="luxury-divider"></div>

      {/* Club Selector (if managing multiple clubs) */}
      {managedClubs.length > 1 && (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-white">Select Club:</label>
              <select
                value={selectedClub?.id || ''}
                onChange={(e) => {
                  const club = managedClubs.find((c) => c.id === Number(e.target.value));
                  setSelectedClub(club || null);
                }}
                className="glass-card border-primary/20 px-4 py-2 rounded-lg bg-background text-white flex-1 max-w-md"
              >
                {managedClubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.title || club.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedClub ? (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No Club Assigned</h3>
            <p className="text-muted-foreground">
              You are not assigned as a club admin for any club yet. Please contact the system administrator.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{eventStats.total}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{eventStats.upcoming}</div>
                <div className="text-sm text-muted-foreground">Upcoming</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{eventStats.past}</div>
                <div className="text-sm text-muted-foreground">Past Events</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and View Toggle */}
          <Card className="glass-card border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="glass-card border-primary/20 px-3 py-2 rounded-lg bg-background text-white text-sm"
                  >
                    <option value="all">All Events</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                    <option value="today">Today</option>
                  </select>

                  {viewMode === 'list' && (
                    <div className="flex items-center gap-1 border border-primary/20 rounded-lg p-1">
                      <Button
                        variant={displayMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setDisplayMode('list')}
                        className="h-8 px-3"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={displayMode === 'cards' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setDisplayMode('cards')}
                        className="h-8 px-3"
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'calendar')}>
            <TabsList className="glass-card border-primary/20">
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                Calendar View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-4">
              <EventsList
                events={filteredEvents}
                isLoading={isLoading}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDelete={handleDelete}
                viewMode={displayMode}
              />
            </TabsContent>

            <TabsContent value="calendar" className="mt-4">
              <EventCalendarView
                events={filteredEvents}
                isLoading={isLoading}
                onDateClick={(date) => {
                  const eventsOnDate = filteredEvents.filter((e) => {
                    if (!e.startAt) return false;
                    try {
                      return format(parseISO(e.startAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                    } catch {
                      return false;
                    }
                  });
                  if (eventsOnDate.length > 0) {
                    handleViewDetails(eventsOnDate[0]);
                  }
                }}
                onEventClick={handleViewDetails}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Modals */}
      <CreateEventDialog
        clubId={selectedClub?.id || 0}
        isOpen={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          handleClose();
        }}
        onSuccess={handleSuccess}
      />

      <EditEventDialog
        event={selectedEvent}
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          handleClose();
        }}
        onSuccess={handleSuccess}
      />

      <DeleteEventDialog
        event={selectedEvent}
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          handleClose();
        }}
        onSuccess={handleSuccess}
      />

      {/* Event Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="glass-card border-primary/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Event Details
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{selectedEvent.title}</h3>
                <p className="text-muted-foreground">{selectedEvent.description}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Start: {formatDate(selectedEvent.startAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">End: {formatDate(selectedEvent.endAt)}</span>
                </div>
                {selectedEvent.latitude && selectedEvent.longitude && (
                  <div className="flex items-center gap-2 text-white">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Location: {parseFloat(selectedEvent.latitude).toFixed(4)}, {parseFloat(selectedEvent.longitude).toFixed(4)}
                    </span>
                  </div>
                )}
                {selectedEvent.participationCount !== undefined && (
                  <div className="flex items-center gap-2 text-white">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedEvent.participationCount || 0} participants</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubAdminEvents;

