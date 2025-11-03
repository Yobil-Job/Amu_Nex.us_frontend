import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { authorityApi, clubApi, studentApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Shield, Plus, Trash2, Search, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { canManageAuthorities } from '@/lib/roles';

const Authorities = () => {
  const { user } = useAuth();
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAuthority, setSelectedAuthority] = useState<any>(null);
  const [searchClubId, setSearchClubId] = useState<string>('');
  const [searchStudentId, setSearchStudentId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    startDate: '', // ✅ Will be converted to LocalDate format (YYYY-MM-DD)
    endDate: '',   // ✅ Will be converted to LocalDate format (YYYY-MM-DD)
    clubId: '',
    studentId: '',
    clubAdminId: '', // ✅ This is the path parameter, not in request body
  });

  useEffect(() => {
    loadClubsAndStudents();
  }, []);

  const loadClubsAndStudents = async () => {
    try {
      const [clubsRes, studentsRes] = await Promise.all([
        clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } })),
        studentApi.getAll().catch(() => ({ _embedded: { studentResponseDtoList: [] } })),
      ]);
      const clubsList = extractCollection<any>(clubsRes);
      const studentsList = extractCollection<any>(studentsRes);
      setClubs(clubsList);
      setStudents(studentsList);
    } catch (error: any) {
      console.error('Failed to load data:', error);
    }
  };

  const loadAuthorities = async () => {
    setIsLoading(true);
    try {
      if (searchClubId && searchClubId !== 'all') {
        const response = await authorityApi.getByClub(parseInt(searchClubId));
        const authoritiesList = extractCollection<any>(response);
        setAuthorities(authoritiesList);
      } else if (searchStudentId && searchStudentId !== 'all') {
        const response = await authorityApi.getByStudent(parseInt(searchStudentId));
        const authoritiesList = extractCollection<any>(response);
        setAuthorities(authoritiesList);
      } else {
        setAuthorities([]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load authorities');
      setAuthorities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.startDate || !formData.endDate || !formData.clubId || !formData.studentId || !formData.clubAdminId) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate name length (backend: min 3, max 50)
      if (formData.name.length < 3 || formData.name.length > 50) {
        toast.error('Role name must be between 3 and 50 characters');
        return;
      }

      // Validate dates
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast.error('Invalid date format');
        return;
      }

      if (startDate >= endDate) {
        toast.error('End date must be after start date');
        return;
      }

      // ✅ Convert dates to LocalDate format (YYYY-MM-DD)
      // The date input already provides YYYY-MM-DD format, which is perfect for LocalDate
      const startDateStr = formData.startDate; // Already in YYYY-MM-DD format
      const endDateStr = formData.endDate;     // Already in YYYY-MM-DD format

      // ✅ clubAdminId is a path parameter, not in request body
      await authorityApi.create(parseInt(formData.clubAdminId), {
        name: formData.name,
        startDate: startDateStr, // ✅ LocalDate format (YYYY-MM-DD)
        endDate: endDateStr,     // ✅ LocalDate format (YYYY-MM-DD)
        clubId: parseInt(formData.clubId),
        studentId: parseInt(formData.studentId),
      });

      toast.success('Authority created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadAuthorities();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create authority');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      clubId: '',
      studentId: '',
      clubAdminId: user?.id?.toString() || '', // Auto-fill from auth if available
    });
    setSelectedAuthority(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent">Authorities</h1>
            <p className="text-muted-foreground text-lg">Manage club leadership and authority roles</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} variant="gradient" className="gap-2 shadow-colored-primary">
          <Plus className="h-4 w-4" />
          Create Authority
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Authorities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="searchClubId">Search by Club</Label>
              <div className="flex gap-2">
                <Select value={searchClubId} onValueChange={setSearchClubId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a club" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clubs</SelectItem>
                    {clubs.map((club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>
                        {club.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={loadAuthorities} disabled={(!searchClubId || searchClubId === 'all') && (!searchStudentId || searchStudentId === 'all')}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchStudentId">Search by Student</Label>
              <div className="flex gap-2">
                <Select value={searchStudentId} onValueChange={setSearchStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.firstname} {student.lastname} ({student.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={loadAuthorities} disabled={(!searchClubId || searchClubId === 'all') && (!searchStudentId || searchStudentId === 'all')}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authority Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading authorities...</div>
          ) : authorities.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchClubId || searchStudentId 
                  ? 'No authority records found for your search criteria.' 
                  : 'Search for authorities by club or student to view records.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authorities.map((authority) => (
                    <TableRow key={authority.id}>
                      <TableCell className="font-medium">{authority.name}</TableCell>
                      <TableCell>{format(new Date(authority.startDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(authority.endDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Active</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canManageAuthorities(user?.role) && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedAuthority(authority);
                                setFormData({
                                  name: authority.name || '',
                                  startDate: authority.startDate ? format(new Date(authority.startDate), 'yyyy-MM-dd') : '',
                                  endDate: authority.endDate ? format(new Date(authority.endDate), 'yyyy-MM-dd') : '',
                                  clubId: authority.club?.id?.toString() || '',
                                  studentId: authority.student?.id?.toString() || '',
                                  clubAdminId: user?.id?.toString() || '',
                                });
                                setIsEditDialogOpen(true);
                              }}
                              title="Edit Authority"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={async () => {
                                if (!confirm('Are you sure you want to delete this authority?')) return;
                                try {
                                  await authorityApi.delete(
                                    authority.id,
                                    authority.club?.id || 0,
                                    user?.id || 0
                                  );
                                  toast.success('Authority deleted successfully');
                                  loadAuthorities();
                                } catch (error: any) {
                                  toast.error(error.message || 'Failed to delete authority');
                                }
                              }}
                              title="Delete Authority"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Authority</DialogTitle>
            <DialogDescription>Assign an authority role to a student</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clubAdminId">Club Admin ID * (Path Parameter)</Label>
              <Input
                id="clubAdminId"
                type="number"
                placeholder={user?.id?.toString() || "Enter club admin ID"}
                value={formData.clubAdminId}
                onChange={(e) => setFormData({ ...formData, clubAdminId: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                This is used as a path parameter for authorization. 
                {user?.id && ` Suggested: ${user.id}`}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Role Name * (3-50 characters)</Label>
              <Input
                id="name"
                placeholder="President, Vice President, Secretary, etc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                minLength={3}
                maxLength={50}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.name.length}/50 characters
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">Format: YYYY-MM-DD</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">Format: YYYY-MM-DD</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clubId">Club *</Label>
              <Select 
                value={formData.clubId} 
                onValueChange={(value) => setFormData({ ...formData, clubId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id.toString()}>
                      {club.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">Student *</Label>
              <Select 
                value={formData.studentId} 
                onValueChange={(value) => setFormData({ ...formData, studentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.firstname} {student.lastname} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} className="w-full">Create Authority</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Authority Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Authority</DialogTitle>
            <DialogDescription>Update authority role information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Role Name * (3-50 characters)</Label>
              <Input
                id="edit-name"
                placeholder="President, Vice President, Secretary, etc."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                minLength={3}
                maxLength={50}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.name.length}/50 characters
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date *</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date *</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-clubId">Club *</Label>
              <Select 
                value={formData.clubId} 
                onValueChange={(value) => setFormData({ ...formData, clubId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id.toString()}>
                      {club.title || club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-studentId">Student *</Label>
              <Select 
                value={formData.studentId} 
                onValueChange={(value) => setFormData({ ...formData, studentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.firstname} {student.lastname} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={async () => {
                if (!selectedAuthority || !user?.id) return;
                try {
                  if (!formData.name || !formData.startDate || !formData.endDate || !formData.clubId || !formData.studentId) {
                    toast.error('Please fill in all required fields');
                    return;
                  }

                  if (formData.name.length < 3 || formData.name.length > 50) {
                    toast.error('Role name must be between 3 and 50 characters');
                    return;
                  }

                  const startDate = new Date(formData.startDate);
                  const endDate = new Date(formData.endDate);
                  if (startDate >= endDate) {
                    toast.error('End date must be after start date');
                    return;
                  }

                  await authorityApi.update(
                    selectedAuthority.id,
                    user.id,
                    {
                      name: formData.name,
                      startDate: formData.startDate,
                      endDate: formData.endDate,
                      clubId: parseInt(formData.clubId),
                      studentId: parseInt(formData.studentId),
                    }
                  );

                  toast.success('Authority updated successfully');
                  setIsEditDialogOpen(false);
                  resetForm();
                  setSelectedAuthority(null);
                  loadAuthorities();
                } catch (error: any) {
                  toast.error(error.message || 'Failed to update authority');
                }
              }}
              className="w-full"
            >
              Update Authority
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Authorities;
