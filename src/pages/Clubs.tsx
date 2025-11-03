import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { clubApi } from '@/lib/api';
import { toast } from 'sonner';
import { Building2, Plus, Pencil, Trash2, Users, CheckCircle, XCircle } from 'lucide-react';

const Clubs = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    club_Type: '',
    description: '',
    logo: '',
  });

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    setIsLoading(true);
    try {
      const response = await clubApi.getAll();
      setClubs(response?._embedded?.responseClubDtoList || []);
    } catch (error) {
      toast.error('Failed to load clubs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await clubApi.create(formData);
      toast.success('Club created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadClubs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create club');
    }
  };

  const handleUpdate = async () => {
    if (!selectedClub) return;
    
    try {
      await clubApi.update(selectedClub.id, formData);
      toast.success('Club updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      loadClubs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update club');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this club?')) return;
    
    try {
      await clubApi.delete(id);
      toast.success('Club deleted successfully');
      loadClubs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete club');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      club_Type: '',
      description: '',
      logo: '',
    });
    setSelectedClub(null);
  };

  const openEditDialog = (club: any) => {
    setSelectedClub(club);
    setFormData({
      title: club.title,
      club_Type: club.club_Type,
      description: club.description,
      logo: club.logo || '',
    });
    setIsEditDialogOpen(true);
  };

  const getClubTypeColor = (type: string) => {
    const colors: any = {
      Acadamic: 'bg-primary/10 text-primary',
      Creative: 'bg-accent/10 text-accent',
      Sport: 'bg-success/10 text-success',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-accent shadow-colored-accent">
            <Building2 className="h-7 w-7 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-accent bg-clip-text text-transparent">Clubs</h1>
            <p className="text-muted-foreground text-lg">Manage university clubs and memberships</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} variant="accent" className="gap-2 shadow-colored-accent">
          <Plus className="h-4 w-4" />
          Create Club
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground font-medium">Loading clubs...</p>
        </div>
      ) : clubs.length === 0 ? (
        <Card className="border-accent/20">
          <CardContent className="text-center py-16">
            <div className="p-4 rounded-2xl bg-gradient-accent/10 inline-block mb-4">
              <Building2 className="h-16 w-16 text-accent" />
            </div>
            <p className="text-muted-foreground text-lg">No clubs found. Create your first club!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club, index) => (
            <Card key={club.id} className="card-hover border-accent/10 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{club.title}</CardTitle>
                    <Badge className={getClubTypeColor(club.club_Type)}>
                      {club.club_Type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {club.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{club.memberCount || 0} members</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(club)}
                    className="flex-1 hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(club.id)}
                    className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Club</DialogTitle>
            <DialogDescription>Add a new club to your university</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Club Name</Label>
              <Input
                id="title"
                placeholder="Computer Science Club"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club_Type">Club Type</Label>
              <Select value={formData.club_Type} onValueChange={(value) => setFormData({ ...formData, club_Type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Acadamic">Academic</SelectItem>
                  <SelectItem value="Creative">Creative</SelectItem>
                  <SelectItem value="Sport">Sport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the club's purpose and activities..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={handleCreate} variant="accent" className="w-full mt-2">Create Club</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
            <DialogDescription>Update club information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Club Name</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-club_Type">Club Type</Label>
              <Select value={formData.club_Type} onValueChange={(value) => setFormData({ ...formData, club_Type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Acadamic">Academic</SelectItem>
                  <SelectItem value="Creative">Creative</SelectItem>
                  <SelectItem value="Sport">Sport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={handleUpdate} variant="accent" className="w-full mt-2">Update Club</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clubs;
