import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { studentApi, authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { Users, Eye, Pencil, Trash2, Lock, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleBadgeColor, getRoleDisplayName } from '@/lib/roles';
import { Skeleton } from '@/components/ui/skeleton';
import StudentFilters from '@/components/admin/StudentFilters';
import StudentProfileModal from '@/components/admin/StudentProfileModal';
import EditStudentDialog from '@/components/admin/EditStudentDialog';
import DeleteStudentDialog from '@/components/admin/DeleteStudentDialog';
import ResetPasswordDialog from '@/components/admin/ResetPasswordDialog';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import Pagination from '@/components/admin/Pagination';
import EmptyState from '@/components/admin/EmptyState';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AdminStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Selection
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Modals
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [studentsRes, authoritiesRes] = await Promise.all([
        studentApi.getAll().catch(() => ({ _embedded: { studentResponseDtoList: [] } })),
        authorityApi.getAll().catch(() => ({ _embedded: { authorityResponseDtoList: [] } })),
      ]);

      const studentsList = extractCollection<any>(studentsRes);
      const authoritiesList = extractCollection<any>(authoritiesRes);

      // Use role directly from student.role field (from students table)
      // Do NOT map from authorities - role is stored in the Student entity
      // Department is now included in StudentResponseDto after backend fix
      const studentsWithRoles = studentsList.map((student: any) => {
        // Role comes directly from student.role field in the database
        // Handle both "ADMIN" and "ROLE_ADMIN" formats if needed
        let role = student.role;
        if (role && role.startsWith('ROLE_')) {
          role = role.replace('ROLE_', '');
        }
        return {
          ...student,
          role: role || 'STUDENT', // Default to STUDENT if no role
          // Department is now included in StudentResponseDto from backend
        };
      });

      setAllStudents(studentsWithRoles);
      setStudents(studentsWithRoles);
      setAuthorities(authoritiesList);
    } catch (error: any) {
      console.error('Failed to load students:', error);
      toast.error(error.message || 'Failed to load students');
      setStudents([]);
      setAllStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique departments
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    allStudents.forEach((student) => {
      if (student.department) {
        deptSet.add(student.department);
      }
    });
    return Array.from(deptSet).sort();
  }, [allStudents]);

  // Filter students
  const filteredStudents = useMemo(() => {
    let filtered = [...allStudents];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((student) => {
        const firstname = (student.firstname || '').toLowerCase();
        const lastname = (student.lastname || '').toLowerCase();
        const email = (student.email || '').toLowerCase();
        const department = (student.department || '').toLowerCase();
        return (
          firstname.includes(query) ||
          lastname.includes(query) ||
          email.includes(query) ||
          department.includes(query) ||
          `${firstname} ${lastname}`.includes(query)
        );
      });
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter((student) => student.department === departmentFilter);
    }

    // Year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter((student) => student.yearOfStay === yearFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((student) => {
        let studentRole = student.role;
        // Handle both "ADMIN" and "ROLE_ADMIN" formats
        if (studentRole && studentRole.startsWith('ROLE_')) {
          studentRole = studentRole.replace('ROLE_', '');
        }
        return studentRole === roleFilter;
      });
    }

    return filtered;
  }, [allStudents, searchQuery, departmentFilter, yearFilter, roleFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, yearFilter, roleFilter]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedStudents(paginatedStudents.map((s) => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId: number, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId));
      setSelectAll(false);
    }
  };

  // Update select all state
  useEffect(() => {
    if (paginatedStudents.length > 0) {
      setSelectAll(selectedStudents.length === paginatedStudents.length);
    } else {
      setSelectAll(false);
    }
  }, [selectedStudents, paginatedStudents]);

  const clearFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('all');
    setYearFilter('all');
    setRoleFilter('all');
  };

  const openProfileModal = (student: any) => {
    setSelectedStudent(student);
    setProfileModalOpen(true);
  };

  const openEditDialog = (student: any) => {
    setSelectedStudent(student);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (student: any) => {
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
  };

  const openResetPasswordDialog = (student: any) => {
    setSelectedStudent(student);
    setResetPasswordDialogOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) {
      toast.error('No students selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedStudents.length} student(s)?`)) {
      return;
    }

    try {
      // Delete students one by one to handle individual failures
      const results = await Promise.allSettled(
        selectedStudents.map((id) => studentApi.delete(id))
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      if (successful > 0) {
        toast.success(`${successful} student(s) deleted successfully`);
      }

      if (failed > 0) {
        const failedIds = results
          .map((r, i) => r.status === 'rejected' ? selectedStudents[i] : null)
          .filter((id) => id !== null);
        toast.error(`Failed to delete ${failed} student(s)`, {
          description: failedIds.length > 0 ? `IDs: ${failedIds.join(', ')}` : undefined,
        });
      }

      // Clear selection and reload data
      setSelectedStudents([]);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete students');
    }
  };


  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Students' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Users className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Student Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage all students, their roles, and memberships
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedStudents.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedStudents.length})
            </Button>
          )}
        </div>
      </div>

      <div className="luxury-divider"></div>

      {/* Filters */}
      <StudentFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        departmentFilter={departmentFilter}
        onDepartmentChange={setDepartmentFilter}
        yearFilter={yearFilter}
        onYearChange={setYearFilter}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        departments={departments}
        onClearFilters={clearFilters}
      />

      {/* Stats Summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{allStudents.length}</div>
            <div className="text-sm text-muted-foreground">Total Students</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{filteredStudents.length}</div>
            <div className="text-sm text-muted-foreground">Filtered Results</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              {allStudents.filter((s) => {
                let role = s.role;
                // Handle both "ADMIN" and "ROLE_ADMIN" formats
                if (role && role.startsWith('ROLE_')) {
                  role = role.replace('ROLE_', '');
                }
                // Only count ADMIN role (Club Admin), not SUPER_USER (Authority)
                return role === 'ADMIN';
              }).length}
            </div>
            <div className="text-sm text-muted-foreground">Club Admins</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{selectedStudents.length}</div>
            <div className="text-sm text-muted-foreground">Selected</div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card className="glass-card border-primary/20">
        <CardHeader className="border-b border-primary/20">
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Students List
            {filteredStudents.length !== allStudents.length && (
              <Badge variant="secondary" className="ml-2">
                {filteredStudents.length} of {allStudents.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students found"
              description={
                searchQuery || departmentFilter !== 'all' || yearFilter !== 'all' || roleFilter !== 'all'
                  ? "Try adjusting your filters to see more results"
                  : "No students have been registered yet"
              }
              actionLabel={
                searchQuery || departmentFilter !== 'all' || yearFilter !== 'all' || roleFilter !== 'all'
                  ? "Clear Filters"
                  : undefined
              }
              onAction={
                searchQuery || departmentFilter !== 'all' || yearFilter !== 'all' || roleFilter !== 'all'
                  ? clearFilters
                  : undefined
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStudents.map((student) => {
                      const isSelected = selectedStudents.includes(student.id);
                      return (
                        <TableRow key={student.id} className={isSelected ? 'bg-primary/10' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                                {(student.firstname?.[0] || '') + (student.lastname?.[0] || '')}
                              </div>
                              <div>
                                <div className="text-white">
                                  {student.firstname} {student.lastname}
                                </div>
                                {student.gender && (
                                  <div className="text-xs text-muted-foreground">{student.gender}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-white">{student.email}</div>
                          </TableCell>
                          <TableCell>
                            {student.department && student.department.trim() !== '' ? (
                              <Badge variant="outline">{student.department}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.yearOfStay ? (
                              <Badge variant="secondary">
                                {student.yearOfStay.replace('_', ' ')}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(student.role)}>
                              {getRoleDisplayName(student.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openProfileModal(student)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(student)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openResetPasswordDialog(student)}>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(student)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-primary/20">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredStudents.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    itemsPerPageOptions={[10, 20, 50, 100]}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <StudentProfileModal
        student={selectedStudent}
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        isLoading={false}
      />

      <EditStudentDialog
        student={selectedStudent}
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSuccess={loadData}
      />

      <DeleteStudentDialog
        student={selectedStudent}
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onSuccess={loadData}
      />

      <ResetPasswordDialog
        student={selectedStudent}
        isOpen={resetPasswordDialogOpen}
        onClose={() => setResetPasswordDialogOpen(false)}
        onSuccess={() => setSelectedStudents([])}
      />
    </div>
  );
};

export default AdminStudents;

