import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  maxSizeMB?: number;
  accept?: string;
}

const ImageUpload = ({ 
  label = 'Logo', 
  value, 
  onChange, 
  maxSizeMB = 5,
  accept = 'image/*'
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`Image size must be less than ${maxSizeMB}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64 for preview and storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        onChange(base64String);
        setIsUploading(false);
        toast.success('Image uploaded successfully');
      };
      reader.onerror = () => {
        toast.error('Failed to read image file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error('Failed to upload image: ' + error.message);
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label className="text-white">{label}</Label>
      
      {preview ? (
        <div className="relative w-full">
          <div className="relative aspect-video w-full max-w-md border border-primary/20 rounded-lg overflow-hidden bg-muted/10">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Click to change image (Max {maxSizeMB}MB)
          </p>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center cursor-pointer hover:border-primary/40 transition-colors bg-muted/10"
        >
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, GIF up to {maxSizeMB}MB
          </p>
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {isUploading && (
        <p className="text-xs text-muted-foreground">Uploading image...</p>
      )}
    </div>
  );
};

export default ImageUpload;

