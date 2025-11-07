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
import { FileText, Loader2, DollarSign, Wrench, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ResourceRequestDialogProps {
  clubId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Client-side storage for resource requests (mock)
const STORAGE_KEY = 'resource_requests';

export const saveResourceRequest = (request: any) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allRequests = stored ? JSON.parse(stored) : [];
    allRequests.push({
      ...request,
      id: Date.now(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRequests));
  } catch (error) {
    console.error('Failed to save resource request:', error);
  }
};

export const loadResourceRequests = (clubId: number): any[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const allRequests = JSON.parse(stored);
    return allRequests.filter((r: any) => r.clubId === clubId && r.status === 'PENDING');
  } catch {
    return [];
  }
};

const RESOURCE_REQUEST_TYPES = [
  { value: 'PURCHASE', label: 'Purchase Request', icon: ShoppingCart },
  { value: 'MAINTENANCE', label: 'Maintenance Request', icon: Wrench },
];

const ResourceRequestDialog = ({ clubId, isOpen, onClose, onSuccess }: ResourceRequestDialogProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestType, setRequestType] = useState<'PURCHASE' | 'MAINTENANCE'>('PURCHASE');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resourceName: '',
    estimatedCost: '',
    urgency: 'MEDIUM',
    reason: '',
    resourceId: '', // For maintenance requests
  });

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setRequestType('PURCHASE');
    setFormData({
      title: '',
      description: '',
      resourceName: '',
      estimatedCost: '',
      urgency: 'MEDIUM',
      reason: '',
      resourceId: '',
    });
  };

  const handleSubmit = async () => {
    // Validate
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (requestType === 'PURCHASE' && !formData.resourceName) {
      toast.error('Please specify the resource name');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to localStorage (mock)
      saveResourceRequest({
        clubId,
        type: requestType,
        requestedBy: user?.id,
        requestedByName: user ? `${user.firstname} ${user.lastname}` : 'Unknown',
        ...formData,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
      });

      toast.success('Resource request submitted successfully');
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const RequestTypeIcon = RESOURCE_REQUEST_TYPES.find((t) => t.value === requestType)?.icon || FileText;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-primary/20 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
            <RequestTypeIcon className="h-5 w-5 text-primary" />
            Submit Resource Request
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Submit a request to the Club Admin for resource purchase or maintenance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Request Type */}
          <div className="space-y-2">
            <Label className="text-white">Request Type</Label>
            <div className="flex gap-2">
              {RESOURCE_REQUEST_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={requestType === type.value ? 'default' : 'outline'}
                    onClick={() => {
                      setRequestType(type.value as 'PURCHASE' | 'MAINTENANCE');
                      setFormData({ ...formData, resourceId: '', resourceName: '' });
                    }}
                    className="flex-1 gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Request Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Request for New Sound System"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="glass-card border-primary/20"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your request in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="glass-card border-primary/20 min-h-[100px]"
              rows={4}
            />
          </div>

          {/* Resource Name (for purchase) or Resource Selection (for maintenance) */}
          {requestType === 'PURCHASE' ? (
            <div className="space-y-2">
              <Label htmlFor="resourceName" className="text-white">
                Resource Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="resourceName"
                placeholder="e.g., Sound System, Water Pump, Club Uniforms"
                value={formData.resourceName}
                onChange={(e) => setFormData({ ...formData, resourceName: e.target.value })}
                className="glass-card border-primary/20"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="resourceId" className="text-white">
                Resource (Optional)
              </Label>
              <Input
                id="resourceId"
                placeholder="Resource name or ID"
                value={formData.resourceId}
                onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
                className="glass-card border-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                Specify the resource that needs maintenance, if applicable
              </p>
            </div>
          )}

          {/* Estimated Cost */}
          <div className="space-y-2">
            <Label htmlFor="estimatedCost" className="text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Estimated Cost (ETB) {requestType === 'PURCHASE' && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="estimatedCost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.estimatedCost}
              onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
              className="glass-card border-primary/20"
            />
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <Label htmlFor="urgency" className="text-white">
              Urgency
            </Label>
            <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
              <SelectTrigger id="urgency" className="glass-card border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-white">
              Reason/Justification
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why this request is needed..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
            disabled={isSubmitting || !formData.title || !formData.description || (requestType === 'PURCHASE' && !formData.resourceName)}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Submit Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceRequestDialog;

