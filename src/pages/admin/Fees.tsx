import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, RefreshCw, TrendingUp } from 'lucide-react';
import { feeApi, clubApi, studentApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import FeesOverview from '@/components/admin/FeesOverview';
import FeesTable from '@/components/admin/FeesTable';
import FeeFilters from '@/components/admin/FeeFilters';
import ClubFinanceChart from '@/components/admin/ClubFinanceChart';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

const AdminFees = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState<any[]>([]);
  const [allFees, setAllFees] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [clubFilter, setClubFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load clubs and students first
      const [clubsRes, studentsRes] = await Promise.all([
        clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } })),
        studentApi.getAll().catch(() => ({ _embedded: { studentResponseDtoList: [] } })),
      ]);

      const clubsList = extractCollection<any>(clubsRes);
      const studentsList = extractCollection<any>(studentsRes);
      setClubs(clubsList);
      setStudents(studentsList);

      // Load fees from all clubs
      const feesPromises = clubsList.map(async (club: any) => {
        try {
          const feesRes = await feeApi.getByClub(club.id);
          // Handle both array and HATEOAS responses
          const feesList = Array.isArray(feesRes) ? feesRes : extractCollection<any>(feesRes) || [];
          return feesList;
        } catch (error) {
          return [];
        }
      });
      
      const allFeesArrays = await Promise.all(feesPromises);
      const allFeesFlat: any[] = [];

      // Flatten and enrich fees with club and student info
      allFeesArrays.forEach((feesList, index) => {
        const club = clubsList[index];
        
        feesList.forEach((fee: any) => {
          // Extract student ID from various possible locations
          const feeStudentId = fee.student?.id || fee.studentId || fee.student_id;
          
          // Find student info
          let student = fee.student;
          if (!student || !student.firstname) {
            student = studentsList.find((s: any) => {
              const studentId = s.id;
              return feeStudentId != null && studentId != null && 
                     (String(feeStudentId) === String(studentId) || 
                      Number(feeStudentId) === Number(studentId));
            });
          }

          // Extract club ID from various possible locations
          const feeClubId = fee.club?.id || fee.clubId || fee.club_id;
          
          // Ensure club is set
          let clubData = fee.club;
          if (!clubData || !clubData.title) {
            clubData = clubsList.find((c: any) => {
              const clubId = c.id;
              return (feeClubId != null && clubId != null && 
                      (String(feeClubId) === String(clubId) || 
                       Number(feeClubId) === Number(clubId))) ||
                     (club.id === clubId); // Fallback to index-based matching
            }) || club; // Use club from index if not found
          }

          allFeesFlat.push({
            ...fee,
            club: clubData || club,
            clubId: feeClubId || club.id,
            student: student || fee.student || {},
            studentId: feeStudentId || fee.studentId || fee.student_id,
          });
        });
      });

      setAllFees(allFeesFlat);
      setFees(allFeesFlat);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load fees');
      setFees([]);
      setAllFees([]);
    } finally {
      setIsLoading(false);
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

    // Club filter
    if (clubFilter !== 'all') {
      filtered = filtered.filter((fee) => {
        // Check multiple possible locations for club ID
        const feeClubId = fee.club?.id || fee.clubId || fee.club_id;
        const clubIdStr = feeClubId?.toString() || '';
        return clubIdStr === clubFilter;
      });
    }

    // Student filter
    if (studentFilter !== 'all') {
      filtered = filtered.filter((fee) => {
        // Check multiple possible locations for student ID
        const feeStudentId = fee.student?.id || fee.studentId || fee.student_id;
        const studentIdStr = feeStudentId?.toString() || '';
        return studentIdStr === studentFilter;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((fee) => {
        const status = (fee.status || '').toUpperCase();
        return status === statusFilter.toUpperCase();
      });
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((fee) => {
        // Check multiple possible date fields
        const dateString = fee.paymentDate || fee.payment_date || 
                          fee.createdAt || fee.created_at ||
                          fee.date || fee.paidDate || fee.paid_date;
        if (!dateString) return false;
        try {
          const feeDate = parseISO(dateString);
          const fromDate = startOfDay(new Date(dateFrom));
          return feeDate >= fromDate;
        } catch {
          try {
            const feeDate = new Date(dateString);
            if (isNaN(feeDate.getTime())) return false;
            const fromDate = startOfDay(new Date(dateFrom));
            return feeDate >= fromDate;
          } catch {
            return false;
          }
        }
      });
    }

    if (dateTo) {
      filtered = filtered.filter((fee) => {
        // Check multiple possible date fields
        const dateString = fee.paymentDate || fee.payment_date || 
                          fee.createdAt || fee.created_at ||
                          fee.date || fee.paidDate || fee.paid_date;
        if (!dateString) return false;
        try {
          const feeDate = parseISO(dateString);
          const toDate = endOfDay(new Date(dateTo));
          return feeDate <= toDate;
        } catch {
          try {
            const feeDate = new Date(dateString);
            if (isNaN(feeDate.getTime())) return false;
            const toDate = endOfDay(new Date(dateTo));
            return feeDate <= toDate;
          } catch {
            return false;
          }
        }
      });
    }

    return filtered;
  }, [allFees, searchQuery, clubFilter, studentFilter, statusFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchQuery('');
    setClubFilter('all');
    setStudentFilter('all');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };


  // Calculate club totals
  const clubTotals = useMemo(() => {
    const totals: Record<number, { name: string; total: number }> = {};
    
    clubs.forEach((club) => {
      totals[club.id] = {
        name: club.title || club.name || `Club ${club.id}`,
        total: 0,
      };
    });

    allFees.forEach((fee) => {
      // Check multiple possible locations for club ID
      const feeClubId = fee.club?.id || fee.clubId || fee.club_id;
      if (!feeClubId || !totals[feeClubId]) return;
      
      // Extract amount from multiple possible locations
      const amount = parseFloat(fee.amount || fee.feeAmount || fee.fee || '0') || 0;
      const status = (fee.status || '').toUpperCase();
      
      // Only count PAID fees
      if (status === 'PAID') {
        totals[feeClubId].total += amount;
      }
    });

    return Object.entries(totals)
      .map(([id, data]) => ({ id: parseInt(id), ...data }))
      .filter((club) => club.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [allFees, clubs]);

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <DollarSign className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Fees & Finance Panel
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage and monitor all fees across all clubs
            </p>
          </div>
        </div>
        <div className="flex gap-2">
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
      </div>

      <div className="luxury-divider"></div>

      {/* Fees Overview Stats */}
      <FeesOverview fees={allFees} isLoading={isLoading} />

      {/* Club Totals */}
      {clubTotals.length > 0 && (
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Fees Collected by Club
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {clubTotals.slice(0, 9).map((club) => (
                <div
                  key={club.id}
                  className="glass-card p-3 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-1">{club.name}</div>
                      <div className="text-2xl font-bold text-success">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 2,
                        }).format(club.total)}
                      </div>
                    </div>
                    <DollarSign className="h-8 w-8 text-success/50" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <FeeFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        clubFilter={clubFilter}
        onClubFilterChange={setClubFilter}
        studentFilter={studentFilter}
        onStudentFilterChange={setStudentFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        clubs={clubs}
        students={students}
        onClearFilters={clearFilters}
      />

      {/* Finance Chart */}
      <ClubFinanceChart fees={allFees} clubs={clubs} isLoading={isLoading} />

      {/* Fees Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredFees.length} of {allFees.length} fee records
          </div>
        </div>
        <FeesTable fees={filteredFees} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default AdminFees;

