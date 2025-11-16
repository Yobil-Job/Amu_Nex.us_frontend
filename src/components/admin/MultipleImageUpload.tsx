import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

interface MultipleImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxSizeMB?: number;
  maxImages?: number;
}

const MultipleImageUpload = ({ 
  images = [],
  onChange,
  maxSizeMB = 5,
  maxImages = 10
}: MultipleImageUploadProps) => {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        continue;
      }

      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast.error(`${file.name} is too large. Maximum size is ${maxSizeMB}MB`);
        continue;
      }

      const currentIndex = images.length + i;
      setUploadingIndex(currentIndex);

      try {
        const uploadResult = await uploadImageToCloudinary(file, 'news/images');
        const newImages = [...images, uploadResult.secure_url];
        onChange(newImages);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error: any) {
        console.error('Failed to upload image:', error);
        toast.error(error.message || `Failed to upload ${file.name}`);
      } finally {
        setUploadingIndex(null);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white">
          Images ({images.length}/{maxImages})
        </label>
        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={uploadingIndex !== null}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Add Images
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploadingIndex !== null || images.length >= maxImages}
      />

      {images.length === 0 && uploadingIndex === null ? (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center cursor-pointer hover:border-primary/40 transition-colors bg-muted/10"
        >
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, GIF up to {maxSizeMB}MB (Max {maxImages} images)
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-square w-full border border-primary/20 rounded-lg overflow-hidden bg-muted/10">
                <img
                  src={imageUrl}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Image+Not+Found';
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(index)}
                  disabled={uploadingIndex === index}
                >
                  <X className="h-4 w-4" />
                </Button>
                {uploadingIndex === index && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </div>
          ))}
          {uploadingIndex !== null && uploadingIndex >= images.length && (
            <div className="relative aspect-square w-full border border-primary/20 rounded-lg overflow-hidden bg-muted/10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {images.length < maxImages && uploadingIndex === null && (
            <div
              onClick={handleClick}
              className="border-2 border-dashed border-primary/20 rounded-lg aspect-square w-full flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors bg-muted/10"
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground text-center px-2">
                Add More
              </p>
            </div>
          )}
        </div>
      )}

      {uploadingIndex !== null && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading image to Cloudinary...</span>
        </div>
      )}
    </div>
  );
};

export default MultipleImageUpload;

