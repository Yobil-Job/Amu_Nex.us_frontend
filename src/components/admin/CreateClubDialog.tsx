import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Upload, X } from 'lucide-react';
import { clubApi } from '@/lib/api';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

interface CreateClubDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateClubDialog = ({ isOpen, onClose, onSuccess }: CreateClubDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    club_Type: '',
    description: '',
    logo: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-upload the image
    setIsUploadingImage(true);
    try {
      const result = await uploadImageToCloudinary(file, 'clubs/logos');
      setFormData({ ...formData, logo: result.secure_url });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload image';
      toast.error(errorMessage);
      console.error('❌ Image upload error:', error);
      
      // Show more details in console for debugging
      if (import.meta.env.DEV) {
        console.error('Upload error details:', {
          message: error.message,
          cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
          preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        });
      }
      
      // Keep the preview even if upload fails, user can try again
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData({ ...formData, logo: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || formData.title.trim().length < 3) {
      toast.error('Club title must be at least 3 characters');
      return;
    }

    if (!formData.description || formData.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }

    if (!formData.club_Type) {
      toast.error('Please select a club type');
      return;
    }

    // If image is selected but not uploaded yet, wait for upload to complete
    if (selectedImage && !formData.logo && isUploadingImage) {
      toast.info('Please wait for image upload to complete');
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        club_Type: formData.club_Type, // Required by backend
      };

      // Only include logo if it exists (optional)
      if (formData.logo) {
        payload.logo = formData.logo;
      }

      console.log('Creating club with payload:', payload);
      const response = await clubApi.create(payload);
      console.log('Club creation response:', response);
      
      toast.success('Club created successfully');
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        title: '',
        club_Type: '',
        description: '',
        logo: '',
      });
      handleRemoveImage();
    } catch (error: any) {
      console.error('Club creation error:', error);
      toast.error(error.message || 'Failed to create club');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !isUploadingImage) {
      setFormData({
        title: '',
        club_Type: '',
        description: '',
        logo: '',
      });
      handleRemoveImage();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create New Club
          </DialogTitle>
          <DialogDescription>
            Add a new club to the system
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Club Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter club title"
              required
              minLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="club_Type">Club Type *</Label>
            <Select
              value={formData.club_Type}
              onValueChange={(value) => setFormData({ ...formData, club_Type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select club type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Acadamic">Academic</SelectItem>
                <SelectItem value="Sport">Sport</SelectItem>
                <SelectItem value="Creative">Creative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter club description (minimum 10 characters)"
              rows={4}
              required
              minLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Club Logo (Optional)</Label>
            <div className="space-y-3">
              {!imagePreview && !formData.logo ? (
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PNG, JPG, GIF up to 5MB
                    </span>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-primary/20">
                    <img
                      src={imagePreview || formData.logo}
                      alt="Club logo preview"
                      className="w-full h-full object-cover"
                    />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-white">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="text-sm">Uploading image...</span>
                        </div>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                      disabled={isUploadingImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.logo && !isUploadingImage && (
                    <p className="text-xs text-success mt-2 flex items-center gap-1">
                      <span>✓</span> Image uploaded successfully
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Club
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClubDialog;

