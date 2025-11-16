import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { clubApi, studentApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import JoinRequestsList from '@/components/admin/JoinRequestsList';
import JoinRequestFilters from '@/components/admin/JoinRequestFilters';
import JoinRequestDetailsModal from '@/components/admin/JoinRequestDetailsModal';
import BulkRequestActions from '@/components/admin/BulkRequestActions';
import { format, parseISO, isToday, isThisWeek, isThisMonth, startOfDay, subDays } from 'date-fns';
import Breadcrumbs from '@/components/admin/Breadcrumbs';

const AdminJoinRequests = () => {
  const { user } = useAuth();
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [clubFilter, setClubFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Modals
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load all clubs first
      const clubsRes = await clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } }));
      const clubsList = extractCollection<any>(clubsRes);
      setClubs(clubsList);

      // Load pending requests for all clubs
      // Note: Backend API only provides getPendingRequests endpoint
      // For full history, we would need an endpoint like getAllRequests or getRequestsByStatus
      const requestsPromises = clubsList.map((club: any) =>
        clubApi.getPendingRequests(club.id).catch(() => ({ _embedded: { requestResponseDtoList: [] } }))
      );
      
      const allRequestsArrays = await Promise.all(requestsPromises);
      const allRequestsFlat: any[] = [];

      // Flatten and enrich requests with club info
      for (let index = 0; index < allRequestsArrays.length; index++) {
        const requestsRes = allRequestsArrays[index];
        const requestsList = extractCollection<any>(requestsRes) || [];
        const club = clubsList[index];
        
        for (const request of requestsList) {
          // Extract student data from various possible locations
          // Student might be nested in request.student, or at top level, or in different fields
          const studentData = request.student || 
                             (request.firstname || request.email ? request : null) || 
                             request.studentResponseDto ||
                             {};
          
          // Extract student ID from various possible locations
          const studentId = studentData?.id || 
                           request.studentId || 
                           request.student_id || 
                           request.id;
          
          // Extract student fields - check both nested and top-level
          let student = {
            id: studentId,
            firstname: studentData.firstname || request.firstname || '',
            lastname: studentData.lastname || request.lastname || '',
            email: studentData.email || request.email || '',
            department: studentData.department || request.department,
            yearOfStay: studentData.yearOfStay || request.yearOfStay,
            gender: studentData.gender || request.gender,
            ...studentData, // Include any other student fields
          };
          
          // If student data is missing, try to fetch it using studentId
          if ((!student.firstname && !student.email) && studentId) {
            try {
              const studentDetails = await studentApi.getById(Number(studentId));
              student = {
                ...student,
                firstname: studentDetails.firstname || student.firstname || '',
                lastname: studentDetails.lastname || student.lastname || '',
                email: studentDetails.email || student.email || '',
                department: studentDetails.department || student.department,
                yearOfStay: studentDetails.yearOfStay || student.yearOfStay,
                gender: studentDetails.gender || student.gender,
              };
            } catch (error) {
              // Failed to fetch student details
            }
          }
          
          // Ensure status is set to PENDING for pending requests
          const enrichedRequest = {
            ...request,
            club: club,
            status: request.status || 'PENDING',
            requestId: `${club.id}-${studentId}`,
            // Ensure student ID is accessible
            studentId: studentId,
            student: student,
          };
          allRequestsFlat.push(enrichedRequest);
        }
      }

      setAllRequests(allRequestsFlat);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load join requests');
      setAllRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    let filtered = [...allRequests];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((request) => {
        const student = request.student || request;
        const firstname = (student.firstname || '').toLowerCase();
        const lastname = (student.lastname || '').toLowerCase();
        const email = (student.email || '').toLowerCase();
        return (
          firstname.includes(query) ||
          lastname.includes(query) ||
          email.includes(query) ||
          `${firstname} ${lastname}`.includes(query)
        );
      });
    }

    // Club filter
    if (clubFilter !== 'all') {
      filtered = filtered.filter((request) => {
        const clubId = request.club?.id?.toString() || '';
        return clubId === clubFilter;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((request) => {
        const status = (request.status || 'PENDING').toUpperCase();
        return status === statusFilter.toUpperCase();
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      filtered = filtered.filter((request) => {
        const dateString = request.createdAt || request.date || request.requestDate;
        if (!dateString) return false;

        try {
          const date = parseISO(dateString);
          const now = new Date();

          switch (dateFilter) {
            case 'today':
              return isToday(date);
            case 'week':
              return isThisWeek(date);
            case 'month':
              return isThisMonth(date);
            case 'older':
              return date < startOfDay(subDays(now, 30));
            default:
              return true;
          }
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [allRequests, searchQuery, clubFilter, statusFilter, dateFilter]);

  // Selection handlers
  const handleSelectRequest = (requestId: number | string, checked: boolean) => {
    const id = typeof requestId === 'string' ? parseInt(requestId) || requestId : requestId;
    if (checked) {
      setSelectedRequests([...selectedRequests, id as number]);
    } else {
      setSelectedRequests(selectedRequests.filter((selectedId) => selectedId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Only select pending requests for bulk actions
      const pendingRequests = filteredRequests.filter(
        (req) => (req.status || 'PENDING').toUpperCase() === 'PENDING'
      );
      const ids = pendingRequests.map((req) => {
        const id = req.requestId || req.id;
        return typeof id === 'string' ? parseInt(id) || id : id;
      });
      setSelectedRequests(ids as number[]);
    } else {
      setSelectedRequests([]);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setClubFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
  };

  const openDetailsModal = (request: any) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  const handleApprove = async (clubId: number, studentId: number) => {
    try {
      // Ensure studentId is a number
      const studentIdNum = Number(studentId);
      if (!studentIdNum || isNaN(studentIdNum)) {
        toast.error('Invalid student ID');
        return;
      }
      await clubApi.approveRequest(clubId, studentIdNum);
      toast.success('Request approved successfully');
      loadData();
      setSelectedRequests([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve request');
    }
  };

  const handleReject = async (clubId: number, studentId: number) => {
    try {
      // Ensure studentId is a number
      const studentIdNum = Number(studentId);
      if (!studentIdNum || isNaN(studentIdNum)) {
        toast.error('Invalid student ID');
        return;
      }
      
      await clubApi.rejectRequest(clubId, studentIdNum);
      toast.success('Request rejected successfully');
      loadData();
      setSelectedRequests([]);
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || 'Failed to reject request';
      toast.error(errorMessage);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRequests.length === 0) {
      toast.error('No requests selected');
      return;
    }

    setIsBulkProcessing(true);
    try {
      const approvePromises = selectedRequests.map((requestId) => {
        const request = allRequests.find((req) => {
          const reqId = req.requestId || req.id;
          const reqIdNum = typeof reqId === 'string' ? parseInt(reqId) : reqId;
          return reqIdNum === requestId || reqId === requestId;
        });
        if (!request) {
          return Promise.resolve();
        }
        
        const clubId = request.club?.id;
        // Extract student ID from various possible locations
        const studentId = request.student?.id || request.studentId || request.student_id || request.id;
        
        if (!clubId || !studentId) {
          return Promise.resolve();
        }
        
        return clubApi.approveRequest(clubId, Number(studentId)).catch((error) => {
          return null;
        });
      });

      await Promise.all(approvePromises);
      toast.success(`${selectedRequests.length} request(s) approved successfully`);
      loadData();
      setSelectedRequests([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve requests');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedRequests.length === 0) {
      toast.error('No requests selected');
      return;
    }

    if (!confirm(`Are you sure you want to reject ${selectedRequests.length} request(s)?`)) {
      return;
    }

    setIsBulkProcessing(true);
    try {
      const rejectPromises = selectedRequests.map((requestId) => {
        const request = allRequests.find((req) => {
          const reqId = req.requestId || req.id;
          const reqIdNum = typeof reqId === 'string' ? parseInt(reqId) : reqId;
          return reqIdNum === requestId || reqId === requestId;
        });
        if (!request) {
          return Promise.resolve();
        }
        
        const clubId = request.club?.id;
        // Extract student ID from various possible locations
        const studentId = request.student?.id || request.studentId || request.student_id || request.id;
        
        if (!clubId || !studentId) {
          return Promise.resolve();
        }
        
        return clubApi.rejectRequest(clubId, Number(studentId)).catch((error) => {
          return null;
        });
      });

      await Promise.all(rejectPromises);
      toast.success(`${selectedRequests.length} request(s) rejected successfully`);
      loadData();
      setSelectedRequests([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject requests');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Count requests by status
  // Note: Since backend only provides pending requests, we only show pending counts
  // For full history (approved/rejected), a backend endpoint would be needed
  const pendingCount = allRequests.filter((req) => (req.status || 'PENDING').toUpperCase() === 'PENDING').length;
  const approvedCount = allRequests.filter((req) => (req.status || '').toUpperCase() === 'APPROVED').length;
  const rejectedCount = allRequests.filter((req) => (req.status || '').toUpperCase() === 'REJECTED').length;

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Join Requests' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Clock className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Join Requests Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage all join requests across all clubs (Currently showing pending requests)
            </p>
          </div>
        </div>
        <Button
          onClick={loadData}
          variant="outline"
          className="gap-2"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="luxury-divider"></div>

      {/* Stats Summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{allRequests.length}</div>
            <div className="text-sm text-muted-foreground">Total Requests</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{approvedCount}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">{rejectedCount}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <JoinRequestFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        clubFilter={clubFilter}
        onClubChange={setClubFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        clubs={clubs}
        onClearFilters={clearFilters}
      />

      {/* Bulk Actions */}
      <BulkRequestActions
        selectedRequests={selectedRequests}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        onClearSelection={() => setSelectedRequests([])}
        isLoading={isBulkProcessing}
      />

      {/* Requests List */}
      <JoinRequestsList
        requests={filteredRequests}
        selectedRequests={selectedRequests}
        onSelectRequest={handleSelectRequest}
        onSelectAll={handleSelectAll}
        onViewDetails={openDetailsModal}
        onApprove={handleApprove}
        onReject={handleReject}
        isLoading={isLoading}
      />

      {/* Details Modal */}
      <JoinRequestDetailsModal
        request={selectedRequest}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        isLoading={false}
      />
    </div>
  );
};

export default AdminJoinRequests;

