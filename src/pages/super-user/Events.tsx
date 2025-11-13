import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, Search, X, RefreshCw, List, Clock, CheckCircle, XCircle } from 'lucide-react';
import { eventApi, clubApi, authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import EventsList from '@/components/super-user/EventsList';
import CreateEventDialog from '@/components/super-user/CreateEventDialog';
import EditEventDialog from '@/components/super-user/EditEventDialog';
import DeleteEventDialog from '@/components/super-user/DeleteEventDialog';
import EventCalendarView from '@/components/super-user/EventCalendarView';
import EventProposalsList, { loadEventProposals, updateProposalStatus } from '@/components/super-user/EventProposalsList';
import EventReportDialog from '@/components/super-user/EventReportDialog';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Users, Building2 } from 'lucide-react';

const SuperUserEvents = () => {
  const { user } = useAuth();
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [displayMode, setDisplayMode] = useState<'list' | 'cards'>('list');
  const [activeTab, setActiveTab] = useState<'events' | 'proposals'>('events');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); // all, upcoming, past, today

  // Modals
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadUserClub();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClub?.id) {
      loadEvents();
      loadProposals();
    }
  }, [selectedClub?.id]);

  // Load user's authorized clubs (using shared utility - same approach as club admin)
  const loadUserClub = async () => {
    if (!user?.id) return;
    
    try {
      const { loadAuthorizedClubsForUser } = await import('@/lib/superUserUtils');
      const clubs = await loadAuthorizedClubsForUser(user.id);

      if (clubs.length === 0) {
        toast.info('You are not assigned as an authority for any club yet. Please contact your club admin.');
        setIsLoading(false);
        return;
      }

      // Use the first club (if multiple, can add selector later)
      setSelectedClub(clubs[0]);
    } catch (error: any) {
      console.error('Failed to load authorized clubs:', error);
      toast.error('Failed to load your club information');
      setIsLoading(false);
    }
  };

  const loadEvents = async () => {
    if (!selectedClub?.id) return;

    setIsLoading(true);
    try {
      const eventsRes = await eventApi.getByClub(selectedClub.id).catch(() => ({ _embedded: { eventList: [] } }));
      const eventsList = extractCollection<any>(eventsRes) || [];
      setAllEvents(eventsList);
      setEvents(eventsList);
    } catch (error: any) {
      toast.error('Failed to load events');
      setEvents([]);
      setAllEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProposals = () => {
    if (!selectedClub?.id) return;
    // Load proposals from localStorage (mock)
    const clubProposals = loadEventProposals(selectedClub.id);
    setProposals(clubProposals);
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

  const handleGenerateReport = (event: any) => {
    setSelectedEvent(event);
    setReportDialogOpen(true);
  };

  const handleApproveProposal = async (proposal: any) => {
    try {
      // Convert proposal to event and create it
      const eventData = {
        title: proposal.title,
        description: proposal.description,
        startAt: proposal.startAt,
        endAt: proposal.endAt,
        clubId: selectedClub.id,
        latitude: proposal.latitude ? parseFloat(proposal.latitude) : null,
        longitude: proposal.longitude ? parseFloat(proposal.longitude) : null,
      };

      await eventApi.create(eventData);
      
      // Update proposal status
      updateProposalStatus(proposal.id, 'APPROVED');
      
      toast.success('Event proposal approved and event created');
      loadEvents();
      loadProposals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve proposal');
    }
  };

  const handleRejectProposal = (proposal: any) => {
    setSelectedProposal(proposal);
    // Update proposal status
    updateProposalStatus(proposal.id, 'REJECTED');
    toast.success('Event proposal rejected');
    loadProposals();
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
              {proposals.length > 0 && (
                <Badge className="bg-accent text-accent-foreground">
                  {proposals.length} Proposals
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedClub
                ? `Manage events for ${selectedClub.title || selectedClub.name || 'Club'}`
                : 'Manage club events and proposals'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedClub && activeTab === 'events' && (
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
            onClick={() => {
              loadEvents();
              loadProposals();
            }}
            disabled={isLoading || !selectedClub}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="luxury-divider"></div>

      {!selectedClub ? (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-12 text-center">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No Club Assigned</h3>
            <p className="text-muted-foreground">
              You are not assigned as an authority for any club yet. Please contact your club admin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'events' | 'proposals')}>
            <TabsList className="glass-card border-primary/20">
              <TabsTrigger value="events" className="gap-2">
                <Calendar className="h-4 w-4" />
                Events
              </TabsTrigger>
              <TabsTrigger value="proposals" className="gap-2">
                <Clock className="h-4 w-4" />
                Proposals
                {proposals.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {proposals.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="mt-6 space-y-6">
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
                          className="pl-10 pr-10 glass-card border-primary/20"
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
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="3" y="3" width="7" height="7" />
                              <rect x="14" y="3" width="7" height="7" />
                              <rect x="14" y="14" width="7" height="7" />
                              <rect x="3" y="14" width="7" height="7" />
                            </svg>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* View Mode Toggle */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="gap-2"
                >
                  <List className="h-4 w-4" />
                  List View
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Calendar View
                </Button>
              </div>

              {/* Events Content */}
              {viewMode === 'list' ? (
                <EventsList
                  events={filteredEvents}
                  isLoading={isLoading}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onGenerateReport={handleGenerateReport}
                  viewMode={displayMode}
                />
              ) : (
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
              )}
            </TabsContent>

            <TabsContent value="proposals" className="mt-6">
              <EventProposalsList
                proposals={proposals}
                isLoading={isLoading}
                onApprove={handleApproveProposal}
                onReject={handleRejectProposal}
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

      <EventReportDialog
        event={selectedEvent}
        isOpen={reportDialogOpen}
        onClose={() => {
          setReportDialogOpen(false);
          handleClose();
        }}
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

export default SuperUserEvents;

