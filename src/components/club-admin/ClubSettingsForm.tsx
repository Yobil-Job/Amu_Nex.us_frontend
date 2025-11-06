import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, Eye, Loader2, Globe, Lock, Mail, Link2, Facebook, Twitter, Instagram } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from './ImageUpload';

interface ClubSettingsFormProps {
  club: any;
  onSave: (data: any) => Promise<void>;
  isLoading?: boolean;
}

const ClubSettingsForm = ({ club, onSave, isLoading = false }: ClubSettingsFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    logo: '',
    visibility: 'PUBLIC',
    email: '',
    website: '',
    facebook: '',
    twitter: '',
    instagram: '',
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);

  useEffect(() => {
    if (club) {
      const data = {
        title: club.title || club.name || '',
        description: club.description || '',
        logo: club.logo || '',
        visibility: club.visibility || club.isPublic !== undefined ? (club.isPublic ? 'PUBLIC' : 'PRIVATE') : 'PUBLIC',
        email: club.email || '',
        website: club.website || '',
        facebook: club.facebook || '',
        twitter: club.twitter || '',
        instagram: club.instagram || '',
      };
      setFormData(data);
      setOriginalData(data);
      setHasChanges(false);
    }
  }, [club]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
    setPreviewMode(false);
  };

  const handleSave = async () => {
    if (!formData.title || formData.title.length < 3) {
      toast.error('Club title must be at least 3 characters');
      return;
    }

    try {
      await onSave({
        title: formData.title,
        description: formData.description || undefined,
        logo: formData.logo || undefined,
        visibility: formData.visibility,
        email: formData.email || undefined,
        website: formData.website || undefined,
        facebook: formData.facebook || undefined,
        twitter: formData.twitter || undefined,
        instagram: formData.instagram || undefined,
      });
      setHasChanges(false);
      setOriginalData({ ...formData });
      toast.success('Club settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData);
      setHasChanges(false);
      setPreviewMode(false);
      toast.info('Changes discarded');
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="preview-mode" className="text-white">Preview Mode</Label>
          <Switch
            id="preview-mode"
            checked={previewMode}
            onCheckedChange={setPreviewMode}
            disabled={!hasChanges}
          />
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
              className="gap-2 purple-gold-gradient"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {previewMode && hasChanges ? (
        /* Preview Card */
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-white">Preview</CardTitle>
            <CardDescription>This is how your club will appear</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.logo && (
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-primary/20">
                  <img src={formData.logo} alt="Club logo" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">{formData.title}</h2>
                <p className="text-muted-foreground mt-2">{formData.description || 'No description'}</p>
              </div>
              <div className="flex items-center gap-2">
                {formData.visibility === 'PUBLIC' ? (
                  <div className="flex items-center gap-1 text-success">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Public</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-warning">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm">Private</span>
                  </div>
                )}
              </div>
              {(formData.email || formData.website || formData.facebook || formData.twitter || formData.instagram) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">Contact & Social Links</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.email && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Mail className="h-3 w-3" />
                        <span>{formData.email}</span>
                      </div>
                    )}
                    {formData.website && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Link2 className="h-3 w-3" />
                        <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                    {formData.facebook && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Facebook className="h-3 w-3" />
                        <a href={formData.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Facebook
                        </a>
                      </div>
                    )}
                    {formData.twitter && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Twitter className="h-3 w-3" />
                        <a href={formData.twitter} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Twitter
                        </a>
                      </div>
                    )}
                    {formData.instagram && (
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Instagram className="h-3 w-3" />
                        <a href={formData.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Instagram
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Settings Form */
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
              <CardDescription>Update your club's basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">
                  Club Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="Enter club title"
                  className="glass-card border-primary/20"
                  minLength={3}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/100 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Enter club description"
                  className="glass-card border-primary/20 min-h-[100px]"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              <ImageUpload
                label="Club Logo"
                value={formData.logo}
                onChange={(value) => handleFieldChange('logo', value)}
                maxSizeMB={5}
              />
            </CardContent>
          </Card>

          {/* Visibility Settings */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Visibility Settings</CardTitle>
              <CardDescription>Control who can see and join your club</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visibility" className="text-white">Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value) => handleFieldChange('visibility', value)}
                >
                  <SelectTrigger className="glass-card border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-primary/20">
                    <SelectItem value="PUBLIC">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Public - Anyone can view and join</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="PRIVATE">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <span>Private - Invitation only</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Contact Information</CardTitle>
              <CardDescription>Add contact details and social media links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder="club@example.com"
                  className="glass-card border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-white flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleFieldChange('website', e.target.value)}
                  placeholder="https://example.com"
                  className="glass-card border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook" className="text-white flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  type="url"
                  value={formData.facebook}
                  onChange={(e) => handleFieldChange('facebook', e.target.value)}
                  placeholder="https://facebook.com/yourclub"
                  className="glass-card border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter" className="text-white flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Label>
                <Input
                  id="twitter"
                  type="url"
                  value={formData.twitter}
                  onChange={(e) => handleFieldChange('twitter', e.target.value)}
                  placeholder="https://twitter.com/yourclub"
                  className="glass-card border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-white flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  type="url"
                  value={formData.instagram}
                  onChange={(e) => handleFieldChange('instagram', e.target.value)}
                  placeholder="https://instagram.com/yourclub"
                  className="glass-card border-primary/20"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ClubSettingsForm;

