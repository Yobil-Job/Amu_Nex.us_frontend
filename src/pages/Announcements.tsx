import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { announcementApi, clubApi, authorityApi, studentApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { announcementSchema, type AnnouncementFormData } from '@/lib/schemas';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bell, Plus, Trash2, Pencil, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { canManageAnnouncements, isSuperAdmin } from '@/lib/roles';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

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

  // Form validation with Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      description: '',
      clubId: '',
    },
  });

  const watchedClubId = watch('clubId');

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

  // Auto-select user's club when opening create dialog (if not SUPER_ADMIN)
  const handleOpenCreateDialog = async () => {
    setIsCreateDialogOpen(true);
    
    // Reset form
    reset();
    setFormData({ title: '', description: '', clubId: '' });

    // Auto-select user's club if they're not SUPER_ADMIN
    if (user?.id && !isSuperAdmin(user?.role)) {
      try {
        // Get user's clubs
        const userClubsRes = await studentApi.getClubs(user.id).catch(() => null);
        if (userClubsRes) {
          const userClubs = extractCollection<any>(userClubsRes);
          // If user has exactly one club, auto-select it
          if (userClubs.length === 1) {
            const autoClubId = userClubs[0].id.toString();
            setFormData({ title: '', description: '', clubId: autoClubId });
            setValue('clubId', autoClubId, { shouldValidate: false });
          }
          // If user has authorities, try to get clubs from authorities
          else if (userClubs.length === 0) {
            const authoritiesRes = await authorityApi.getByStudent(user.id).catch(() => null);
            if (authoritiesRes) {
              const authorities = extractCollection<any>(authoritiesRes);
              if (authorities.length > 0) {
                // Get unique club IDs from authorities
                const clubIds = [...new Set(authorities.map((auth: any) => auth.club?.id || auth.clubId))];
                // If only one club, auto-select it
                if (clubIds.length === 1) {
                  const autoClubId = clubIds[0].toString();
                  setFormData({ title: '', description: '', clubId: autoClubId });
                  setValue('clubId', autoClubId, { shouldValidate: false });
                }
              }
            }
          }
        }
      } catch (error) {
        // Silently fail - user can still manually select
        console.log('Could not auto-select club:', error);
      }
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

  const handleCreate = async (data: AnnouncementFormData) => {
    if (!user?.id) {
      toast.error('User information not available. Please login again.');
      return;
    }

    try {
      await announcementApi.create({
        title: data.title,
        description: data.description,
        clubId: parseInt(data.clubId),
        // createdById is auto-populated by backend from authentication
      });
      
      toast.success('Announcement created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      reset();
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
    reset();
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
          <Button onClick={handleOpenCreateDialog} className="gap-2 bg-gradient-to-r from-warning to-accent shadow-md hover:shadow-lg">
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
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {filterClubId !== 'all'
                ? 'No announcements found for the selected club. Try selecting a different club or create a new announcement.'
                : 'No announcements have been posted yet. Create the first one!'}
            </p>
          </div>
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

      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          resetForm();
          reset();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>Share an update with club members</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clubId">Club *</Label>
              <Select 
                value={watchedClubId || formData.clubId}
                onValueChange={(value) => {
                  setValue('clubId', value, { shouldValidate: true });
                  setFormData({ ...formData, clubId: value });
                }}
              >
                <SelectTrigger className={errors.clubId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No clubs available</div>
                  ) : (
                    clubs.map((club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>
                        {club.title || club.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.clubId && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.clubId.message}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Important Update"
                {...register('title')}
                onChange={(e) => {
                  setValue('title', e.target.value);
                  setFormData({ ...formData, title: e.target.value });
                }}
                className={errors.title ? 'border-destructive' : ''}
                maxLength={50}
              />
              <div className="flex items-center justify-between">
                <div>
                  {errors.title && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.title.message}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/50 characters
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Write your announcement..."
                {...register('description')}
                onChange={(e) => {
                  setValue('description', e.target.value);
                  setFormData({ ...formData, description: e.target.value });
                }}
                className={errors.description ? 'border-destructive' : ''}
                rows={4}
                maxLength={1000}
              />
              <div className="flex items-center justify-between">
                <div>
                  {errors.description && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.description.message}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/1000 characters
                </p>
              </div>
            </div>
            {user?.id && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                Creating as: {user.firstname || user.email} (ID: {user.id})
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Announcement'}
            </Button>
          </form>
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
