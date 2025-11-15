import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Newspaper, Plus, Edit, Trash2, Loader2, X, Upload } from 'lucide-react';
import { newsApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import EmptyState from '@/components/admin/EmptyState';

const AdminNews = () => {
  const { user } = useAuth();
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    images: [] as string[],
  });
  const [imageInputs, setImageInputs] = useState<string[]>(['']);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setIsLoading(true);
    try {
      const response = await newsApi.getAll();
      const newsList = extractCollection<any>(response) || [];
      setNews(newsList);
    } catch (error: any) {
      console.error('Failed to load news:', error);
      toast.error('Failed to load news');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedNews(null);
    setFormData({ title: '', description: '', images: [] });
    setImageInputs(['']);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (newsItem: any) => {
    setIsEditing(true);
    setSelectedNews(newsItem);
    const images = newsItem.images
      ? newsItem.images.split(',').map((img: string) => img.trim()).filter((img: string) => img.length > 0)
      : [];
    setFormData({
      title: newsItem.title || '',
      description: newsItem.description || '',
      images: images,
    });
    setImageInputs(images.length > 0 ? images : ['']);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setSelectedNews(null);
    setFormData({ title: '', description: '', images: [] });
    setImageInputs(['']);
  };

  const addImageInput = () => {
    setImageInputs([...imageInputs, '']);
  };

  const removeImageInput = (index: number) => {
    const newInputs = imageInputs.filter((_, i) => i !== index);
    setImageInputs(newInputs);
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const updateImageInput = (index: number, value: string) => {
    const newInputs = [...imageInputs];
    newInputs[index] = value;
    setImageInputs(newInputs);
    const newImages = [...formData.images];
    newImages[index] = value.trim();
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.title.length < 5 || formData.title.length > 200) {
      toast.error('Title must be between 5 and 200 characters');
      return;
    }

    if (formData.description.length < 10 || formData.description.length > 5000) {
      toast.error('Description must be between 10 and 5000 characters');
      return;
    }

    const validImages = imageInputs
      .map(img => img.trim())
      .filter(img => img.length > 0 && (img.startsWith('http://') || img.startsWith('https://')));

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        images: validImages,
      };

      if (isEditing && selectedNews) {
        await newsApi.update(selectedNews.id, payload);
        toast.success('News updated successfully');
      } else {
        await newsApi.create(payload);
        toast.success('News created successfully');
      }
      handleCloseDialog();
      loadNews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save news');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this news article?')) {
      return;
    }

    try {
      await newsApi.delete(id);
      toast.success('News deleted successfully');
      loadNews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete news');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      <Breadcrumbs items={[{ label: 'News Management' }]} />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Newspaper className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white">
              News Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Create and manage system news articles
            </p>
          </div>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="gap-2 purple-gold-gradient"
        >
          <Plus className="h-4 w-4" />
          Create News
        </Button>
      </div>

      <div className="luxury-divider"></div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card border-primary/20">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : news.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No News Articles"
          description="Create your first news article to get started."
          action={
            <Button onClick={handleOpenCreate} className="gap-2 purple-gold-gradient">
              <Plus className="h-4 w-4" />
              Create News
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {news.map((item) => {
            const images = item.images
              ? item.images.split(',').map((img: string) => img.trim()).filter((img: string) => img.length > 0)
              : [];

            return (
              <Card key={item.id} className="glass-card border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-white mb-2">{item.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {item.createdAt ? format(parseISO(item.createdAt), 'PPp') : 'Unknown date'}
                        </span>
                        {images.length > 0 && (
                          <span>{images.length} image{images.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {images.length > 0 && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={images[0]}
                        alt={item.title}
                        className="w-full h-64 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450?text=Image+Not+Found';
                        }}
                      />
                    </div>
                  )}
                  <p className="text-white whitespace-pre-wrap">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="glass-card border-primary/20 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              {isEditing ? 'Edit News' : 'Create News'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isEditing ? 'Update the news article' : 'Create a new news article'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter news title (5-200 characters)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="glass-card border-primary/20"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/200 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Enter news description (10-5000 characters)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="glass-card border-primary/20 min-h-[150px]"
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/5000 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Images (URLs)
              </Label>
              {imageInputs.map((input, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Enter image URL (https://...)"
                    value={input}
                    onChange={(e) => updateImageInput(index, e.target.value)}
                    className="glass-card border-primary/20 flex-1"
                  />
                  {imageInputs.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeImageInput(index)}
                      className="text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addImageInput}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Image URL
              </Button>
              <p className="text-xs text-muted-foreground">
                Enter image URLs (one per line). Images will be displayed in a carousel.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
              className="gap-2 purple-gold-gradient"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Newspaper className="h-4 w-4" />
                  {isEditing ? 'Update News' : 'Create News'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNews;

