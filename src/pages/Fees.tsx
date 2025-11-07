import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { feeApi, clubApi, studentApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { feeSchema, type FeeFormData } from '@/lib/schemas';
import { toast } from 'sonner';
import { DollarSign, Plus, Search, AlertCircle, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { isStudent, isSuperAdmin, isSuperUser } from '@/lib/roles';
import { useAuth } from '@/contexts/AuthContext';
import StudentFees from './student/Fees';
import AdminFees from './admin/Fees';
import ClubAdminFees from './club-admin/Fees';
import SuperUserFinance from './super-user/Finance';

const Fees = () => {
  const { user } = useAuth();

  // Route SUPER_ADMIN to admin version
  if (isSuperAdmin(user?.role)) {
    return <AdminFees />;
  }

  // Route ADMIN (club admin) to club admin version
  if (user?.role === 'ADMIN') {
    return <ClubAdminFees />;
  }

  // Route SUPER_USER to super user finance version
  if (isSuperUser(user?.role)) {
    return <SuperUserFinance />;
  }

  // Render student-specific fees page for students
  if (isStudent(user?.role)) {
    return <StudentFees />;
  }

  const [fees, setFees] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [clubTotal, setClubTotal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchClubId, setSearchClubId] = useState<string>('');
  const [searchStudentId, setSearchStudentId] = useState<string>('');
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    clubId: '',
    studentId: '',
  });

  // Form validation with Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      amount: '',
      purpose: '',
      clubId: '',
      studentId: '',
    },
  });

  const watchedClubId = watch('clubId');
  const watchedStudentId = watch('studentId');

  // ✅ Status enum values - must match backend exactly
  const FEE_STATUSES = {
    PAID: 'PAID',
    PENDING: 'PENDING',
    FAILED: 'FAILED',
  } as const;

  const [isLoadingClubsStudents, setIsLoadingClubsStudents] = useState(true);

  useEffect(() => {
    loadClubsAndStudents();
  }, []);

  const loadClubsAndStudents = async () => {
    setIsLoadingClubsStudents(true);
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
      toast.error('Failed to load clubs and students');
    } finally {
      setIsLoadingClubsStudents(false);
    }
  };

  const loadFees = async () => {
    setIsLoading(true);
    try {
      if (searchClubId && searchClubId !== 'all') {
        const [feesResponse, totalResponse] = await Promise.all([
          feeApi.getByClub(parseInt(searchClubId)).catch(() => ({ _embedded: { feeList: [] } })),
          feeApi.getTotalByClub(parseInt(searchClubId)).catch(() => null),
        ]);
        const feesList = extractCollection<any>(feesResponse);
        setFees(feesList);
        setClubTotal(totalResponse || null);
      } else if (searchStudentId && searchStudentId !== 'all') {
        const response = await feeApi.getByStudent(parseInt(searchStudentId));
        const feesList = extractCollection<any>(response);
        setFees(feesList);
        setClubTotal(null); // Student fees don't have club total
      } else {
        setFees([]);
        setClubTotal(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load fees');
      setFees([]);
      setClubTotal(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: FeeFormData) => {
    try {
      await feeApi.record(
        parseInt(data.clubId),
        parseInt(data.studentId),
        {
          amount: parseFloat(data.amount),
          purpose: data.purpose,
        }
      );
      toast.success('Fee recorded successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      reset();
      loadFees();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record fee');
    }
  };

  const handleStatusUpdate = async (feeId: number, status: string) => {
    try {
      // ✅ Validate status enum matches backend (PAID, PENDING, FAILED)
      const validStatuses = Object.values(FEE_STATUSES);
      if (!validStatuses.includes(status as any)) {
        toast.error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        return;
      }

      await feeApi.updateStatus(feeId, status);
      toast.success('Fee status updated successfully');
      loadFees();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      purpose: '',
      clubId: '',
      studentId: '',
    });
    reset();
  };

  const getStatusColor = (status: string) => {
    // ✅ Status enum values match backend exactly
    const colors: Record<string, string> = {
      [FEE_STATUSES.PAID]: 'bg-success/10 text-success',
      [FEE_STATUSES.PENDING]: 'bg-warning/10 text-warning',
      [FEE_STATUSES.FAILED]: 'bg-destructive/10 text-destructive',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <TooltipProvider>
      <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-warning to-warning/70 shadow-md">
            <DollarSign className="h-7 w-7 text-warning-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-warning to-warning/70 bg-clip-text text-transparent">Fees</h1>
            <p className="text-muted-foreground text-lg">Track and manage club membership fees</p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 bg-gradient-to-r from-warning to-warning/80 shadow-md hover:shadow-lg">
              <Plus className="h-4 w-4" />
              Record Fee
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Record a new fee payment for a student</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Search Fees</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Search for fees by selecting a club or student. Select one filter and click the search button.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingClubsStudents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : (
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
                      {clubs.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No clubs available</div>
                      ) : (
                        clubs.map((club) => (
                          <SelectItem key={club.id} value={club.id.toString()}>
                            {club.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button onClick={loadFees} disabled={(!searchClubId || searchClubId === 'all') && (!searchStudentId || searchStudentId === 'all')}>
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
                      {students.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No students available</div>
                      ) : (
                        students.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.firstname} {student.lastname} ({student.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button onClick={loadFees} disabled={(!searchClubId || searchClubId === 'all') && (!searchStudentId || searchStudentId === 'all')}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Collected Card (shown only when club is selected) */}
      {clubTotal !== null && searchClubId && searchClubId !== 'all' && (
        <Card className="border-success/20 bg-gradient-success/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-3xl font-bold text-success">{clubTotal.toFixed(2)} ETB</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {clubs.find(c => c.id.toString() === searchClubId)?.title || 'Club'}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-success/50" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fee Records ({fees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-32" />
                </div>
              ))}
            </div>
          ) : fees.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No fee records found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchClubId || searchStudentId 
                  ? 'No fee records match your search criteria. Try selecting a different club or student.' 
                  : 'Search for fees by selecting a club or student from the dropdowns above.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="font-medium">{fee.amount?.toFixed(2) || '0.00'} ETB</TableCell>
                      <TableCell>{fee.purpose || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(fee.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(fee.status)}>
                          {fee.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={fee.status || FEE_STATUSES.PENDING}
                          onValueChange={(value) => handleStatusUpdate(fee.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {/* ✅ Status enum values match backend exactly */}
                            <SelectItem value={FEE_STATUSES.PAID}>Paid</SelectItem>
                            <SelectItem value={FEE_STATUSES.PENDING}>Pending</SelectItem>
                            <SelectItem value={FEE_STATUSES.FAILED}>Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record New Fee</DialogTitle>
            <DialogDescription>Create a fee record for a student</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="amount">Amount *</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the fee amount in ETB (Ethiopian Birr)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="50.00"
                {...register('amount')}
                onChange={(e) => {
                  setValue('amount', e.target.value);
                  setFormData({ ...formData, amount: e.target.value });
                }}
                className={errors.amount ? 'border-destructive' : ''}
              />
              {errors.amount && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.amount.message}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose *</Label>
              <Input
                id="purpose"
                placeholder="Annual membership fee"
                {...register('purpose')}
                onChange={(e) => {
                  setValue('purpose', e.target.value);
                  setFormData({ ...formData, purpose: e.target.value });
                }}
                className={errors.purpose ? 'border-destructive' : ''}
              />
              {errors.purpose && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.purpose.message}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clubId">Club *</Label>
              <Select 
                value={watchedClubId || formData.clubId}
                onValueChange={(value) => {
                  setValue('clubId', value, { shouldValidate: true });
                  setFormData({ ...formData, clubId: value });
                }}
              >
                <SelectTrigger className={errors.clubId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a club" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No clubs available</div>
                  ) : (
                    clubs.map((club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>
                        {club.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.clubId && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.clubId.message}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">Student *</Label>
              <Select 
                value={watchedStudentId || formData.studentId}
                onValueChange={(value) => {
                  setValue('studentId', value, { shouldValidate: true });
                  setFormData({ ...formData, studentId: value });
                }}
              >
                <SelectTrigger className={errors.studentId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No students available</div>
                  ) : (
                    students.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.firstname} {student.lastname} ({student.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.studentId && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.studentId.message}</span>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Fee'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

export default Fees;
