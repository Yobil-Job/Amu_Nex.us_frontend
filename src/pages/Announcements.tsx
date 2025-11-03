import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { announcementApi, clubApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bell, Plus, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { canManageAnnouncements } from '@/lib/roles';

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [filterClubId, setFilterClubId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clubId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [announcementsRes, clubsRes] = await Promise.all([
        announcementApi.getAll(),
        clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } })),
      ]);
      const announcementsList = extractCollection<any>(announcementsRes);
      const clubsList = extractCollection<any>(clubsRes);
      setAnnouncements(announcementsList);
      setFilteredAnnouncements(announcementsList);
      setClubs(clubsList);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter announcements by club
  useEffect(() => {
    if (filterClubId === 'all') {
      setFilteredAnnouncements(announcements);
    } else {
      const filtered = announcements.filter(ann => 
        ann.club?.id?.toString() === filterClubId || ann.clubId?.toString() === filterClubId
      );
      setFilteredAnnouncements(filtered);
    }
  }, [filterClubId, announcements]);

  const handleCreate = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.clubId) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate title length (backend: min 3, max 50)
      if (formData.title.length < 3 || formData.title.length > 50) {
        toast.error('Title must be between 3 and 50 characters');
        return;
      }

      // Validate description length (backend: min 3, max 1000)
      if (formData.description.length < 3 || formData.description.length > 1000) {
        toast.error('Description must be between 3 and 1000 characters');
        return;
      }

      // ✅ Auto-populate createdById from authenticated user
      if (!user?.id) {
        toast.error('User information not available. Please login again.');
        return;
      }

      await announcementApi.create({
        title: formData.title,
        description: formData.description,
        clubId: parseInt(formData.clubId),
        // ✅ createdById is auto-populated by backend from authentication
      });
      
      toast.success('Announcement created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create announcement');
    }
  };

  const handleUpdate = async () => {
    if (!selectedAnnouncement || !user?.id) return;

    try {
      await announcementApi.update(selectedAnnouncement.id, {
        title: formData.title,
        description: formData.description,
      });

      toast.success('Announcement updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      setSelectedAnnouncement(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update announcement');
    }
  };

  const openEditDialog = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title || '',
      description: announcement.description || '',
      clubId: announcement.club?.id?.toString() || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number, createdById: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await announcementApi.delete(id, createdById);
      toast.success('Announcement deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete announcement');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      clubId: '',
    });
    setSelectedAnnouncement(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-warning to-accent shadow-md">
            <Bell className="h-7 w-7 text-warning-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-warning to-accent bg-clip-text text-transparent">Announcements</h1>
            <p className="text-muted-foreground text-lg">Manage club announcements and updates</p>
          </div>
        </div>
        {canManageAnnouncements(user?.role) && (
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 bg-gradient-to-r from-warning to-accent shadow-md hover:shadow-lg">
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        )}
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="filterClub">Filter by Club</Label>
            <Select value={filterClubId} onValueChange={setFilterClubId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All Clubs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {clubs.map((club) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.title || club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterClubId !== 'all' && (
              <Badge variant="secondary">
                {filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading announcements...</div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No announcements found. Create your first announcement!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{announcement.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {announcement.createdAt && format(new Date(announcement.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {canManageAnnouncements(user?.role) && (
                    <>
                      {(user?.id === announcement.createdById || canManageAnnouncements(user?.role)) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(announcement)}
                          title="Edit Announcement"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {(user?.id === announcement.createdById || canManageAnnouncements(user?.role)) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(announcement.id, announcement.createdById)}
                          title="Delete Announcement"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {announcement.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>Share an update with club members</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id.toString()}>
                      {club.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clubs.length === 0 && (
                <p className="text-xs text-muted-foreground">No clubs available</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title * (3-50 characters)</Label>
              <Input
                id="title"
                placeholder="Important Update"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                minLength={3}
                maxLength={50}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/50 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description * (3-1000 characters)</Label>
              <Textarea
                id="description"
                placeholder="Write your announcement..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                minLength={3}
                maxLength={1000}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/1000 characters
              </p>
            </div>
            {user?.id && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                Creating as: {user.firstname || user.email} (ID: {user.id})
              </div>
            )}
            <Button onClick={handleCreate} className="w-full">Create Announcement</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>Update announcement information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title * (3-50 characters)</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                minLength={3}
                maxLength={50}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/50 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description * (3-1000 characters)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                minLength={3}
                maxLength={1000}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/1000 characters
              </p>
            </div>
            <Button onClick={handleUpdate} className="w-full">Update Announcement</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Announcements;
