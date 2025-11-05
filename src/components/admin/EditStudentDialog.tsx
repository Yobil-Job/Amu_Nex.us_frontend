import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { studentApi } from '@/lib/api';
import { toast } from 'sonner';
import { Pencil, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EditStudentDialogProps {
  student: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditStudentDialog = ({ student, isOpen, onClose, onSuccess }: EditStudentDialogProps) => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    gender: '',
    yearOfStay: '',
    department: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (student && isOpen) {
      setFormData({
        firstname: student.firstname || '',
        lastname: student.lastname || '',
        email: student.email || '',
        gender: student.gender || '',
        yearOfStay: student.yearOfStay || '',
        department: student.department || '',
      });
    }
  }, [student, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.id) return;

    // Validation
    if (!formData.firstname || formData.firstname.length < 2) {
      toast.error('First name must be at least 2 characters');
      return;
    }

    if (!formData.lastname || formData.lastname.length < 2) {
      toast.error('Last name must be at least 2 characters');
      return;
    }

    setIsLoading(true);
    try {
      await studentApi.update(student.id, {
        firstname: formData.firstname,
        lastname: formData.lastname,
        gender: formData.gender || undefined,
        yearOfStay: formData.yearOfStay || undefined,
        department: formData.department || undefined,
      });
      toast.success('Student updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update student');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Edit Student
          </DialogTitle>
          <DialogDescription>
            Update student information and details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstname">First Name *</Label>
              <Input
                id="firstname"
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastname">Last Name *</Label>
              <Input
                id="lastname"
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                required
                minLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Computer Science"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="PREFER_NOT_TO_MENTION">Prefer Not to Mention</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearOfStay">Year of Stay</Label>
              <Select value={formData.yearOfStay} onValueChange={(value) => setFormData({ ...formData, yearOfStay: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First_Year">First Year</SelectItem>
                  <SelectItem value="Second_Year">Second Year</SelectItem>
                  <SelectItem value="Third_Year">Third Year</SelectItem>
                  <SelectItem value="Fourth_Year">Fourth Year</SelectItem>
                  <SelectItem value="Fivth_Year">Fifth Year</SelectItem>
                  <SelectItem value="Sixth_Year">Sixth Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
                  Updating...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Update Student
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStudentDialog;

