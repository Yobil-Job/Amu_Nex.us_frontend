import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Loader2, MapPin, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ResourceFormProps {
  resource: any | null;
  clubId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Client-side storage for resources (mock)
const STORAGE_KEY = 'club_resources';

export const saveResource = (resource: any) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allResources = stored ? JSON.parse(stored) : [];
    
    if (resource.id) {
      // Update existing
      const updated = allResources.map((r: any) =>
        r.id === resource.id ? { ...resource, updatedAt: new Date().toISOString() } : r
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } else {
      // Create new
      allResources.push({
        ...resource,
        id: Date.now(),
        status: 'AVAILABLE',
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allResources));
    }
  } catch (error) {
    console.error('Failed to save resource:', error);
  }
};

export const loadResources = (clubId: number): any[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const allResources = JSON.parse(stored);
    return allResources.filter((r: any) => r.clubId === clubId);
  } catch {
    return [];
  }
};

export const deleteResource = (resourceId: number) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const allResources = JSON.parse(stored);
    const filtered = allResources.filter((r: any) => r.id !== resourceId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete resource:', error);
  }
};

const RESOURCE_CATEGORIES = [
  'SOUND_SYSTEM',
  'WATER_TOOLS',
  'UNIFORMS',
  'SPORTS_EQUIPMENT',
  'ELECTRONICS',
  'FURNITURE',
  'TOOLS',
  'VEHICLES',
  'OTHER',
];

const ResourceForm = ({ resource, clubId, isOpen, onClose, onSuccess }: ResourceFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'OTHER',
    location: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    notes: '',
  });

  const isEditing = !!resource;

  useEffect(() => {
    if (resource && isOpen) {
      setFormData({
        name: resource.name || '',
        description: resource.description || '',
        category: resource.category || 'OTHER',
        location: resource.location || '',
        serialNumber: resource.serialNumber || '',
        purchaseDate: resource.purchaseDate ? new Date(resource.purchaseDate).toISOString().split('T')[0] : '',
        purchasePrice: resource.purchasePrice?.toString() || '',
        notes: resource.notes || '',
      });
    } else if (isOpen) {
      resetForm();
    }
  }, [resource, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'OTHER',
      location: '',
      serialNumber: '',
      purchaseDate: '',
      purchasePrice: '',
      notes: '',
    });
  };

  const handleSubmit = async () => {
    // Validate
    if (!formData.name || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to localStorage (mock)
      saveResource({
        ...(isEditing ? { id: resource.id } : {}),
        clubId,
        ...formData,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
      });

      toast.success(`Resource ${isEditing ? 'updated' : 'created'} successfully`);
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} resource`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-primary/20 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {isEditing ? 'Edit Resource' : 'Add New Resource'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? 'Update resource information' : 'Add a new club resource to your inventory'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Resource Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Sound System, Water Pump, Club Uniforms"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="glass-card border-primary/20"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the resource..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="glass-card border-primary/20 min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-white">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger id="category" className="glass-card border-primary/20">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-white flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Storage Location
            </Label>
            <Input
              id="location"
              placeholder="e.g., Storage Room A, Club Office"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="glass-card border-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Serial Number */}
            <div className="space-y-2">
              <Label htmlFor="serialNumber" className="text-white flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Serial Number
              </Label>
              <Input
                id="serialNumber"
                placeholder="Optional"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="glass-card border-primary/20"
              />
            </div>

            {/* Purchase Date */}
            <div className="space-y-2">
              <Label htmlFor="purchaseDate" className="text-white">
                Purchase Date
              </Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="glass-card border-primary/20"
              />
            </div>
          </div>

          {/* Purchase Price */}
          <div className="space-y-2">
            <Label htmlFor="purchasePrice" className="text-white">
              Purchase Price (ETB)
            </Label>
            <Input
              id="purchasePrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              className="glass-card border-primary/20"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or maintenance information"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="glass-card border-primary/20 min-h-[80px]"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name || !formData.category}
            className="gap-2 purple-gold-gradient"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Package className="h-4 w-4" />
                {isEditing ? 'Update Resource' : 'Create Resource'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceForm;

