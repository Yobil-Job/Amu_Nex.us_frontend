import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { announcementApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clubId: '',
    createdById: '',
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const response = await announcementApi.getAll();
      const announcementsList = extractCollection<any>(response);
      setAnnouncements(announcementsList);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await announcementApi.create({
        title: formData.title,
        description: formData.description,
        clubId: parseInt(formData.clubId),
        createdById: parseInt(formData.createdById),
      });
      toast.success('Announcement created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadAnnouncements();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create announcement');
    }
  };

  const handleDelete = async (id: number, createdById: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await announcementApi.delete(id, createdById);
      toast.success('Announcement deleted successfully');
      loadAnnouncements();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete announcement');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      clubId: '',
      createdById: '',
    });
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
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 bg-gradient-to-r from-warning to-accent shadow-md hover:shadow-lg">
          <Plus className="h-4 w-4" />
          New Announcement
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No announcements found. Create your first announcement!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{announcement.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {announcement.createdAt && format(new Date(announcement.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(announcement.id, announcement.createdById)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
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
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Important Update"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Write your announcement..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clubId">Club ID</Label>
                <Input
                  id="clubId"
                  type="number"
                  placeholder="1"
                  value={formData.clubId}
                  onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="createdById">Your Student ID</Label>
                <Input
                  id="createdById"
                  type="number"
                  placeholder="1"
                  value={formData.createdById}
                  onChange={(e) => setFormData({ ...formData, createdById: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full">Create Announcement</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Announcements;
