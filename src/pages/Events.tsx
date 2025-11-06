import { useEffect, useState, useCallback, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LocationPicker } from '@/components/LocationPicker';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { eventApi, clubApi, authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Calendar, Plus, Pencil, Trash2, MapPin, Clock, Map, HelpCircle } from 'lucide-react';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { canCreateEvent, canUpdateEvent, isStudent, isSuperAdmin } from '@/lib/roles';
import { useMemo } from 'react';
import { Filter, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import StudentEventsView from './student/StudentEventsView';
import AdminEvents from './admin/Events';
import ClubAdminEvents from './club-admin/Events';

const Events = () => {
  const { user } = useAuth();

  // Route SUPER_ADMIN to admin version
  if (isSuperAdmin(user?.role)) {
    return <AdminEvents />;
  }

  // Route ADMIN (club admin) to club admin version
  if (user?.role === 'ADMIN') {
    return <ClubAdminEvents />;
  }

  // Render student-specific events page for students
  if (isStudent(user?.role)) {
    return <StudentEventsView />;
  }
  const [events, setEvents] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]); // Store all events for filtering
  const [clubs, setClubs] = useState<any[]>([]);
  const [userAuthorities, setUserAuthorities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterClubId, setFilterClubId] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '', // ✅ Changed from startTime
    endAt: '',   // ✅ Changed from endTime
    latitude: '',
    longitude: '',
    clubId: '',
  });

  // Filter clubs based on user permissions
  const filterClubsByPermissions = useCallback((allClubs: any[], authorities: any[]): any[] => {
    // SUPER_ADMIN can create events for any club
    if (user?.role === 'SUPER_ADMIN') {
      return allClubs;
    }

    // Regular users need authority in a club or be club admin
    if (!user?.id) {
      return [];
    }

    // Get club IDs where user has authority
    const clubIdsWithAuthority = authorities.map(auth => auth.club?.id).filter(Boolean);
    
    // Filter clubs: user can create events if they have authority in that club
    return allClubs.filter(club => {
      // Check if user has authority in this club
      return clubIdsWithAuthority.includes(club.id);
    });
  }, [user?.role, user?.id]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [eventsRes, clubsRes] = await Promise.all([
        eventApi.getAll().catch(() => ({ _embedded: { eventList: [] } })),
        clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } })),
      ]);
              const eventsList = extractCollection<any>(eventsRes);
        const allClubs = extractCollection<any>(clubsRes);
        
        setAllEvents(eventsList); // Store all events
      
      // Load user authorities to filter clubs
      if (user?.id && user?.role !== 'SUPER_ADMIN') {
        try {
          const authoritiesRes = await authorityApi.getByStudent(user.id);
          const authorities = extractCollection<any>(authoritiesRes);
          setUserAuthorities(authorities);
          
          // Filter clubs based on permissions
          const allowedClubs = filterClubsByPermissions(allClubs, authorities);
          setClubs(allowedClubs);
        } catch (error: any) {
          // If user has no authorities or error, filter by role only
          console.warn('Failed to load authorities:', error);
          const allowedClubs = filterClubsByPermissions(allClubs, []);
          setClubs(allowedClubs);
        }
      } else {
        // SUPER_ADMIN or no user - show all clubs
        const allowedClubs = filterClubsByPermissions(allClubs, []);
        setClubs(allowedClubs);
      }
          } catch (error: any) {
        console.error('Failed to load data:', error);
        toast.error(error.message || 'Failed to load data');
        setAllEvents([]);
        setClubs([]);
      } finally {
        setIsLoading(false);
      }
    }, [user?.id, user?.role, filterClubsByPermissions]);

    useEffect(() => {
      loadData();
    }, [loadData]);

    // Filter events based on club and date filters
    const filteredEvents = useMemo(() => {
      let filtered = [...allEvents];

      // Filter by club
      if (filterClubId && filterClubId !== 'all') {
        const clubIdNum = parseInt(filterClubId);
        filtered = filtered.filter((event: any) => {
          const eventClubId = event.club?.id || event.clubId;
          return eventClubId === clubIdNum;
        });
      }

      // Filter by date range
      if (filterDateFrom) {
        const fromDate = startOfDay(new Date(filterDateFrom));
        filtered = filtered.filter((event: any) => {
          if (!event.startAt) return false;
          const eventDate = startOfDay(parseISO(event.startAt));
          return isAfter(eventDate, fromDate) || eventDate.getTime() === fromDate.getTime();
        });
      }

      if (filterDateTo) {
        const toDate = endOfDay(new Date(filterDateTo));
        filtered = filtered.filter((event: any) => {
          if (!event.startAt) return false;
          const eventDate = endOfDay(parseISO(event.startAt));
          return isBefore(eventDate, toDate) || eventDate.getTime() === toDate.getTime();
        });
      }

      return filtered;
    }, [allEvents, filterClubId, filterDateFrom, filterDateTo]);

    // Update displayed events when filters change
    useEffect(() => {
      setEvents(filteredEvents);
    }, [filteredEvents]);

    // Get unique clubs from all events for filter dropdown
    const uniqueClubsFromEvents = useMemo(() => {
      const clubsMap: Record<number, { id: number; name: string }> = {};
      allEvents.forEach((event: any) => {
        const club = event.club;
        const clubId = club?.id || event.clubId;
        const clubName = club?.title || club?.name || 'Unknown Club';
        if (clubId && !clubsMap[clubId]) {
          clubsMap[clubId] = { id: clubId, name: clubName };
        }
      });
      return Object.values(clubsMap);
    }, [allEvents]);

  // Convert datetime-local input to ISO string for LocalDateTime
  const convertToISO = (dateTimeLocal: string): string | null => {
    if (!dateTimeLocal) return null;
    // datetime-local format: "2025-01-15T14:30"
    // Convert to ISO: "2025-01-15T14:30:00"
    // If no timezone, assume local time
    const date = new Date(dateTimeLocal);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  };

  const handleCreate = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.startAt || !formData.endAt || !formData.clubId) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate title length (backend: min 10, max 100)
      if (formData.title.length < 10 || formData.title.length > 100) {
        toast.error('Title must be between 10 and 100 characters');
        return;
      }

      // Validate description length (backend: min 10, max 1000)
      if (formData.description.length < 10 || formData.description.length > 1000) {
        toast.error('Description must be between 10 and 1000 characters');
        return;
      }

      const startAtISO = convertToISO(formData.startAt);
      const endAtISO = convertToISO(formData.endAt);

      if (!startAtISO || !endAtISO) {
        toast.error('Invalid date/time format');
        return;
      }

      if (new Date(startAtISO) >= new Date(endAtISO)) {
        toast.error('End time must be after start time');
        return;
      }

      // Backend expects: startAt, endAt (not startTime, endTime)
      // createdBy is auto-filled from authentication, don't send it
      await eventApi.create({
        title: formData.title,
        description: formData.description,
        startAt: startAtISO, // ✅ Mapped correctly
        endAt: endAtISO,     // ✅ Mapped correctly
        clubId: parseInt(formData.clubId),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        // ✅ createdBy is NOT sent - backend extracts from Authentication
        // ✅ location field removed - backend doesn't have it
      });
      
      toast.success('Event created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create event');
    }
  };

  const handleUpdate = async () => {
    if (!selectedEvent) return;

    try {
      const startAtISO = convertToISO(formData.startAt);
      const endAtISO = convertToISO(formData.endAt);

      if (!startAtISO || !endAtISO) {
        toast.error('Invalid date/time format');
        return;
      }

      await eventApi.update(selectedEvent.id, {
        title: formData.title,
        description: formData.description,
        startAt: startAtISO,
        endAt: endAtISO,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      });

      toast.success('Event updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      setSelectedEvent(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update event');
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData({
      ...formData,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    });
  };

  const openEditDialog = (event: any) => {
    setSelectedEvent(event);
    // Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:mm)
    const formatForInput = (isoString: string) => {
      if (!isoString) return '';
      try {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch {
        return '';
      }
    };

    setFormData({
      title: event.title || '',
      description: event.description || '',
      startAt: formatForInput(event.startAt),
      endAt: formatForInput(event.endAt),
      latitude: event.latitude?.toString() || '',
      longitude: event.longitude?.toString() || '',
      clubId: event.club?.id?.toString() || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await eventApi.delete(id);
      toast.success('Event deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete event');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startAt: '',
      endAt: '',
      latitude: '',
      longitude: '',
      clubId: '',
    });
    setSelectedEvent(null);
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  // Guard against undefined user during initial load
  if (!user && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-success border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-success">
                <Calendar className="h-7 w-7 text-success-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-success bg-clip-text text-transparent">Events</h1>
                <p className="text-muted-foreground text-lg">Manage club events and activities</p>
              </div>
            </div>
            {canCreateEvent(user?.role) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 bg-gradient-success shadow-md hover:shadow-lg">
                    <Plus className="h-4 w-4" />
                    Create Event
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create a new event for your club</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

        {/* Filter Section */}
        <Card className="border-success/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Events
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter events by club or date range to find specific events</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {/* Club Filter */}
              <div className="space-y-2">
                <Label htmlFor="filter-club">Filter by Club</Label>
                <Select value={filterClubId} onValueChange={setFilterClubId}>
                  <SelectTrigger id="filter-club">
                    <SelectValue placeholder="All Clubs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clubs</SelectItem>
                    {uniqueClubsFromEvents.map((club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From Filter */}
              <div className="space-y-2">
                <Label htmlFor="filter-date-from">From Date</Label>
                <Input
                  id="filter-date-from"
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>

              {/* Date To Filter */}
              <div className="space-y-2">
                <Label htmlFor="filter-date-to">To Date</Label>
                <div className="flex gap-2">
                  <Input
                    id="filter-date-to"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                  {(filterClubId !== 'all' || filterDateFrom || filterDateTo) && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setFilterClubId('all');
                        setFilterDateFrom('');
                        setFilterDateTo('');
                      }}
                      title="Clear filters"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {(filterClubId !== 'all' || filterDateFrom || filterDateTo) && (
              <div className="mt-3 text-sm text-muted-foreground">
                Showing {events.length} of {allEvents.length} events
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-success border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground font-medium">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
        <Card className="border-success/20">
          <CardContent className="text-center py-16">
            <div className="p-4 rounded-2xl bg-gradient-success/10 inline-block mb-4">
              <Calendar className="h-16 w-16 text-success" />
            </div>
            <p className="text-muted-foreground text-lg">No events found. Create your first event!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <Card key={event.id} className="card-hover border-success/10 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <CardHeader>
                <CardTitle className="text-lg">{event.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {event.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDateTime(event.startAt || event.startTime)}</span>
                  </div>
                  {event.endAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Ends: {formatDateTime(event.endAt)}</span>
                    </div>
                  )}
                  {(event.latitude && event.longitude) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="text-xs">
                          Location available
                        </span>
                      </div>
                      <LocationPicker
                        latitude={event.latitude}
                        longitude={event.longitude}
                        onLocationChange={() => {}}
                        height="200px"
                        editable={false}
                        eventTitle={event.title}
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedEvent(event);
                      setIsDetailsDialogOpen(true);
                    }}
                    className="flex-1 gap-2 bg-gradient-primary shadow-colored-primary"
                  >
                    View Details
                  </Button>
                  {canUpdateEvent(user?.role) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(event)}
                        className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                        title="Edit Event"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                        className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                        title="Delete Event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>Schedule a new event for a club</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title * (10-100 characters)</Label>
              <Input
                id="title"
                placeholder="Annual Tech Summit"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                minLength={10}
                maxLength={100}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/100 characters
                {formData.title.length > 0 && formData.title.length < 10 && (
                  <span className="text-warning"> (minimum 10 characters required)</span>
                )}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description * (10-1000 characters)</Label>
              <Textarea
                id="description"
                placeholder="Describe the event in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                minLength={10}
                maxLength={1000}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/1000 characters
                {formData.description.length > 0 && formData.description.length < 10 && (
                  <span className="text-warning"> (minimum 10 characters required)</span>
                )}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clubId">Club *</Label>
              <Select 
                value={formData.clubId} 
                onValueChange={(value) => setFormData({ ...formData, clubId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.length > 0 ? (
                    clubs.map((club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>
                        {club.title || club.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No clubs available
                    </div>
                  )}
                </SelectContent>
              </Select>
              {clubs.length === 0 && (
                <p className="text-xs text-warning">
                  You don't have permission to create events for any club. 
                  {user?.role === 'SUPER_ADMIN' ? ' Contact system administrator.' : ' You need to be a club admin or have authority (president, secretary, etc.) in a club.'}
                </p>
              )}
              {user?.role === 'SUPER_ADMIN' && clubs.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Loading clubs...
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startAt">Start Date & Time *</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAt">End Date & Time *</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Event Location (optional)</Label>
              <ErrorBoundary
                fallback={
                  <div className="w-full h-[350px] bg-muted rounded-lg flex items-center justify-center border border-border">
                    <div className="text-center p-4">
                      <p className="text-muted-foreground text-sm mb-2">Map component unavailable</p>
                      <p className="text-xs text-muted-foreground">Please enter coordinates manually below</p>
                    </div>
                  </div>
                }
              >
                {isCreateDialogOpen && (
                  <Suspense
                    fallback={
                      <div className="w-full h-[350px] bg-muted rounded-lg flex items-center justify-center border border-border">
                        <div className="text-center">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent mb-2"></div>
                          <p className="text-xs text-muted-foreground">Loading map...</p>
                        </div>
                      </div>
                    }
                  >
                    <LocationPicker
                      latitude={formData.latitude ? parseFloat(formData.latitude) : null}
                      longitude={formData.longitude ? parseFloat(formData.longitude) : null}
                      onLocationChange={handleLocationChange}
                      height="350px"
                      editable={true}
                      eventTitle={formData.title || 'New Event'}
                    />
                  </Suspense>
                )}
              </ErrorBoundary>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-1">
                  <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    placeholder="Auto-filled from map"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    readOnly={!!formData.latitude}
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    placeholder="Auto-filled from map"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    readOnly={!!formData.longitude}
                    className="bg-muted"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Click on the map above to select the event location. Coordinates are automatically captured.
              </p>
            </div>
            <Button onClick={handleCreate} className="w-full mt-2 bg-gradient-success shadow-md hover:shadow-lg">
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update event information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Event Title * (10-100 characters)</Label>
              <Input
                id="edit-title"
                placeholder="Annual Tech Summit"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                minLength={10}
                maxLength={100}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/100 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description * (10-1000 characters)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                minLength={10}
                maxLength={1000}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/1000 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-clubId">Club</Label>
              <Select 
                value={formData.clubId} 
                onValueChange={(value) => setFormData({ ...formData, clubId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.length > 0 ? (
                    clubs.map((club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>
                        {club.title || club.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No clubs available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startAt">Start Date & Time *</Label>
                <Input
                  id="edit-startAt"
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endAt">End Date & Time *</Label>
                <Input
                  id="edit-endAt"
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Event Location (optional)</Label>
              <ErrorBoundary
                fallback={
                  <div className="w-full h-[350px] bg-muted rounded-lg flex items-center justify-center border border-border">
                    <div className="text-center p-4">
                      <p className="text-muted-foreground text-sm mb-2">Map component unavailable</p>
                      <p className="text-xs text-muted-foreground">Please enter coordinates manually below</p>
                    </div>
                  </div>
                }
              >
                {isEditDialogOpen && (
                  <Suspense
                    fallback={
                      <div className="w-full h-[350px] bg-muted rounded-lg flex items-center justify-center border border-border">
                        <div className="text-center">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent mb-2"></div>
                          <p className="text-xs text-muted-foreground">Loading map...</p>
                        </div>
                      </div>
                    }
                  >
                    <LocationPicker
                      latitude={formData.latitude ? parseFloat(formData.latitude) : null}
                      longitude={formData.longitude ? parseFloat(formData.longitude) : null}
                      onLocationChange={handleLocationChange}
                      height="350px"
                      editable={true}
                      eventTitle={formData.title || selectedEvent?.title || 'Event'}
                    />
                  </Suspense>
                )}
              </ErrorBoundary>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-latitude" className="text-xs">Latitude</Label>
                  <Input
                    id="edit-latitude"
                    type="number"
                    step="0.000001"
                    placeholder="Auto-filled from map"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    readOnly={!!formData.latitude}
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-longitude" className="text-xs">Longitude</Label>
                  <Input
                    id="edit-longitude"
                    type="number"
                    step="0.000001"
                    placeholder="Auto-filled from map"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    readOnly={!!formData.longitude}
                    className="bg-muted"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Click on the map above to select or update the event location.
              </p>
            </div>
            <Button onClick={handleUpdate} className="w-full mt-2 bg-gradient-success shadow-md hover:shadow-lg">
              Update Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.club?.title && `Organized by ${selectedEvent.club.title}`}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm leading-relaxed">{selectedEvent.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Start Date & Time
                  </Label>
                  <p className="mt-1 font-medium">{formatDateTime(selectedEvent.startAt || selectedEvent.startTime)}</p>
                </div>
                {selectedEvent.endAt && (
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      End Date & Time
                    </Label>
                    <p className="mt-1 font-medium">{formatDateTime(selectedEvent.endAt)}</p>
                  </div>
                )}
              </div>

              {selectedEvent.latitude && selectedEvent.longitude && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  <ErrorBoundary
                    fallback={
                      <div className="w-full h-[300px] bg-muted rounded-lg flex items-center justify-center border border-border">
                        <p className="text-muted-foreground text-sm">Map unavailable</p>
                      </div>
                    }
                  >
                    <Suspense fallback={
                      <div className="w-full h-[300px] bg-muted rounded-lg flex items-center justify-center border border-border">
                        <div className="text-center">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent mb-2"></div>
                          <p className="text-xs text-muted-foreground">Loading map...</p>
                        </div>
                      </div>
                    }>
                      <LocationPicker
                        latitude={selectedEvent.latitude}
                        longitude={selectedEvent.longitude}
                        onLocationChange={() => {}}
                        height="300px"
                        editable={false}
                        eventTitle={selectedEvent.title}
                      />
                    </Suspense>
                  </ErrorBoundary>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Coordinates: {selectedEvent.latitude.toFixed(6)}, {selectedEvent.longitude.toFixed(6)}
                  </div>
                </div>
              )}

              {selectedEvent.createdBy && (
                <div>
                  <Label className="text-muted-foreground">Created By</Label>
                  <p className="mt-1 text-sm">
                    {selectedEvent.createdBy.firstname} {selectedEvent.createdBy.lastname}
                    {selectedEvent.createdBy.email && ` (${selectedEvent.createdBy.email})`}
                  </p>
                </div>
              )}

              {canUpdateEvent(user?.role) && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDetailsDialogOpen(false);
                      openEditDialog(selectedEvent);
                    }}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Event
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
};

export default Events;
