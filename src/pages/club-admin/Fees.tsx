import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, RefreshCw } from 'lucide-react';
import { feeApi, clubApi, authorityApi, studentApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { loadManagedClubsForUser } from '@/lib/clubAdminUtils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import FeesTable from '@/components/club-admin/FeesTable';
import FeesOverview from '@/components/club-admin/FeesOverview';
import FeesFilters from '@/components/club-admin/FeesFilters';
import FeesChart from '@/components/club-admin/FeesChart';
import ExportFeesButton from '@/components/club-admin/ExportFeesButton';
import { format, parseISO, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';

const ClubAdminFees = () => {
  const { user } = useAuth();
  const [managedClubs, setManagedClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [allFees, setAllFees] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadManagedClubs();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClub?.id) {
      loadFees();
      loadMembers();
    }
  }, [selectedClub?.id]);

  // Load clubs where user is assigned as club admin (ADMIN role)
  const loadManagedClubs = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const clubs = await loadManagedClubsForUser(user.id);

      if (clubs.length === 0) {
        toast.info('You are not assigned as a club admin for any club yet. Please contact the system administrator.');
        setIsLoading(false);
        return;
      }

      setManagedClubs(clubs);

      if (clubs.length === 1) {
        setSelectedClub(clubs[0]);
      } else if (clubs.length > 1) {
        setSelectedClub(clubs[0]);
      }
    } catch (error: any) {
      console.error('Failed to load managed clubs:', error);
      toast.error('Failed to load your clubs');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFees = async () => {
    if (!selectedClub?.id) return;

    setIsLoading(true);
    try {
      // Fetch both fees and members in parallel (same approach as authorities page)
      const [feesRes, membersRes] = await Promise.all([
        feeApi.getByClub(selectedClub.id).catch(() => []),
        clubApi.getMembers(selectedClub.id).catch(() => ({ _embedded: { studentResponseDtoList: [] } })),
      ]);
      
      const feesList = Array.isArray(feesRes) ? feesRes : extractCollection<any>(feesRes) || [];
      const membersList = extractCollection<any>(membersRes) || [];
      
      // Since fee response doesn't include student ID, we need to match by checking each member's fees
      // Create a map of fee ID to fee data
      const feesMap = new Map();
      feesList.forEach((fee: any) => {
        feesMap.set(Number(fee.id), fee);
      });
      
      // For each member, get their fees and match with our club's fees
      const enrichedFees: any[] = [];
      
      for (const member of membersList) {
        if (!member.id) continue;
        
        try {
          // Get all fees for this student
          const studentFeesRes = await feeApi.getByStudent(Number(member.id)).catch(() => []);
          const studentFees = Array.isArray(studentFeesRes) ? studentFeesRes : extractCollection<any>(studentFeesRes) || [];
          
          // Find fees that match our club's fees (by ID)
          for (const studentFee of studentFees) {
            const feeId = studentFee.id;
            if (feesMap.has(Number(feeId))) {
              // This student has this fee - enrich it with student data
              const fee = feesMap.get(Number(feeId));
              enrichedFees.push({
                ...fee,
                student: {
                  id: Number(member.id),
                  firstname: member.firstname || '',
                  lastname: member.lastname || '',
                  email: member.email || '',
                  department: member.department,
                  yearOfStay: member.yearOfStay,
                  ...member,
                },
                studentId: Number(member.id),
              });
              
              // Remove from map so we don't add it twice
              feesMap.delete(Number(feeId));
            }
          }
        } catch (error) {
          // Failed to get fees for student
        }
      }
      
      // Add any remaining fees that weren't matched (shouldn't happen, but handle gracefully)
      feesMap.forEach((fee) => {
        enrichedFees.push({
          ...fee,
          student: {},
          studentId: undefined,
        });
      });
      
      setAllFees(enrichedFees);
      setFees(enrichedFees);
    } catch (error: any) {
      toast.error('Failed to load fees');
      setFees([]);
      setAllFees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!selectedClub?.id) return;

    try {
      const membersRes = await clubApi.getMembers(selectedClub.id).catch(() => ({ _embedded: { studentResponseDtoList: [] } }));
      const membersList = extractCollection<any>(membersRes) || [];
      setMembers(membersList);
    } catch (error: any) {
      console.error('Failed to load members:', error);
      setMembers([]);
    }
  };

  // Filter fees
  const filteredFees = useMemo(() => {
    let filtered = [...allFees];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((fee) => {
        const student = fee.student || {};
        const firstname = (student.firstname || '').toLowerCase();
        const lastname = (student.lastname || '').toLowerCase();
        const email = (student.email || '').toLowerCase();
        const purpose = (fee.purpose || '').toLowerCase();
        return (
          firstname.includes(query) ||
          lastname.includes(query) ||
          email.includes(query) ||
          purpose.includes(query) ||
          `${firstname} ${lastname}`.includes(query)
        );
      });
    }

    // Member filter
    if (memberFilter !== 'all') {
      filtered = filtered.filter((fee) => {
        const studentId = fee.student?.id || fee.studentId;
        return studentId?.toString() === memberFilter;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((fee) => {
        const status = (fee.status || '').toUpperCase();
        return status === statusFilter.toUpperCase();
      });
    }

    // Date filters
    if (dateFrom) {
      const fromDate = startOfDay(new Date(dateFrom));
      filtered = filtered.filter((fee) => {
        const feeDate = fee.paidAt || fee.createdAt || fee.date;
        if (!feeDate) return false;
        try {
          const date = startOfDay(new Date(feeDate));
          return isAfter(date, fromDate) || date.getTime() === fromDate.getTime();
        } catch {
          return false;
        }
      });
    }

    if (dateTo) {
      const toDate = endOfDay(new Date(dateTo));
      filtered = filtered.filter((fee) => {
        const feeDate = fee.paidAt || fee.createdAt || fee.date;
        if (!feeDate) return false;
        try {
          const date = endOfDay(new Date(feeDate));
          return isBefore(date, toDate) || date.getTime() === toDate.getTime();
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [allFees, searchQuery, memberFilter, statusFilter, dateFrom, dateTo]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setMemberFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Fees' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <DollarSign className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Fees Management
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedClub
                ? `View and manage fees for ${selectedClub.title || selectedClub.name || 'Club'}`
                : 'Select a club to view fees'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedClub && (
            <ExportFeesButton fees={filteredFees} clubName={selectedClub.title || selectedClub.name} />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadFees}
            disabled={isLoading || !selectedClub}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="luxury-divider"></div>

      {/* Club Selector (if managing multiple clubs) */}
      {managedClubs.length > 1 && (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-white">Select Club:</label>
              <select
                value={selectedClub?.id || ''}
                onChange={(e) => {
                  const club = managedClubs.find((c) => c.id === Number(e.target.value));
                  setSelectedClub(club || null);
                }}
                className="glass-card border-primary/20 px-4 py-2 rounded-lg bg-background text-white flex-1 max-w-md"
              >
                {managedClubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.title || club.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedClub ? (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-12 text-center">
            <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No Club Assigned</h3>
            <p className="text-muted-foreground">
              You are not assigned as a club admin for any club yet. Please contact the system administrator.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Fees Overview */}
          <FeesOverview fees={filteredFees} isLoading={isLoading} />

          {/* Filters */}
          <FeesFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            memberFilter={memberFilter}
            onMemberFilterChange={setMemberFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            members={members}
            onClearFilters={handleClearFilters}
          />

          {/* Charts */}
          <FeesChart fees={filteredFees} isLoading={isLoading} />

          {/* Fees Table */}
          <FeesTable fees={filteredFees} isLoading={isLoading} />
        </>
      )}
    </div>
  );
};

export default ClubAdminFees;

