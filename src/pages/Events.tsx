import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { eventApi, clubApi } from '@/lib/api';
import { toast } from 'sonner';
import { Calendar, Plus, Pencil, Trash2, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';

const Events = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    latitude: '',
    longitude: '',
    clubId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, clubsRes] = await Promise.all([
        eventApi.getAll(),
        clubApi.getAll(),
      ]);
      setEvents(eventsRes?._embedded?.eventList || []);
      setClubs(clubsRes?._embedded?.responseClubDtoList || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await eventApi.create({
        ...formData,
        clubId: parseInt(formData.clubId),
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
      });
      toast.success('Event created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create event');
    }
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
      startTime: '',
      endTime: '',
      location: '',
      latitude: '',
      longitude: '',
      clubId: '',
    });
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
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
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 bg-gradient-success shadow-md hover:shadow-lg">
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>

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
                    <span>{formatDateTime(event.startTime)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(event.id)}
                    className="flex-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
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
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                placeholder="Annual Tech Summit"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the event..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Main Auditorium"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (optional)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="0.0"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (optional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="0.0"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clubId">Club</Label>
              <Input
                id="clubId"
                type="number"
                placeholder="Enter club ID"
                value={formData.clubId}
                onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
              />
            </div>
            <Button onClick={handleCreate} className="w-full mt-2 bg-gradient-success shadow-md hover:shadow-lg">Create Event</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Events;
