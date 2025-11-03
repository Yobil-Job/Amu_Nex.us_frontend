import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { studentApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { Pencil, Trash2, Eye, Plus, Users } from 'lucide-react';
import { canViewAllStudents } from '@/lib/roles';
import { useAuth } from '@/contexts/AuthContext';

const Students = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    gender: '',
    yearOfStay: '',
  });

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const response = await studentApi.getAll();
      console.log('📊 Students API Response (full):', JSON.stringify(response, null, 2)); // Debug log
      
      // Use extractCollection which handles multiple formats
      const studentsList = extractCollection<any>(response);
      
      console.log('✅ Extracted students:', studentsList.length, studentsList); // Debug log
      
      if (studentsList.length === 0 && response) {
        console.warn('⚠️ No students extracted. Response structure:', {
          hasEmbedded: !!response._embedded,
          embeddedKeys: response._embedded ? Object.keys(response._embedded) : [],
          isArray: Array.isArray(response),
          responseKeys: Object.keys(response),
        });
      }
      
      setStudents(studentsList);
    } catch (error: any) {
      console.error('❌ Error loading students:', error); // Debug log
      toast.error(error.message || 'Failed to load students');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedStudent) return;
    
    try {
      await studentApi.update(selectedStudent.id, formData);
      toast.success('Student updated successfully');
      setIsDialogOpen(false);
      loadStudents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update student');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
      await studentApi.delete(id);
      toast.success('Student deleted successfully');
      loadStudents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete student');
    }
  };

  const openEditDialog = (student: any) => {
    setSelectedStudent(student);
    setFormData({
      firstname: student.firstname,
      lastname: student.lastname,
      email: student.email,
      gender: student.gender,
      yearOfStay: student.yearOfStay,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Users className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent">Students</h1>
            <p className="text-muted-foreground text-lg">Manage student information and enrollments</p>
          </div>
        </div>
      </div>

      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-xl flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gradient-primary animate-pulse"></div>
            All Students ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground font-medium">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.firstname} {student.lastname}
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{student.gender}</Badge>
                      </TableCell>
                      <TableCell>{student.yearOfStay?.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(student)}
                            className="hover:bg-primary/10 hover:text-primary transition-all"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(student.id)}
                            className="hover:bg-destructive/10 hover:text-destructive transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Student</DialogTitle>
            <DialogDescription className="text-base">Update student information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">First Name</Label>
                <Input
                  id="firstname"
                  value={formData.firstname}
                  onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  value={formData.lastname}
                  onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="PREFER_NOT_TO_MENTION">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearOfStay">Year</Label>
                <Select value={formData.yearOfStay} onValueChange={(value) => setFormData({ ...formData, yearOfStay: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First_Year">First Year</SelectItem>
                    <SelectItem value="Second_Year">Second Year</SelectItem>
                    <SelectItem value="Third_Year">Third Year</SelectItem>
                    <SelectItem value="Fourth_Year">Fourth Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleUpdate} variant="gradient" className="w-full mt-2">Update Student</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Students;
