import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { feeApi, studentApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DollarSign, Search, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FeeSummary from '@/components/student/FeeSummary';
import PaymentStatusCard from '@/components/student/PaymentStatusCard';

const StudentFees = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState<any[]>([]);
  const [allFees, setAllFees] = useState<any[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClubId, setFilterClubId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  // Helper function to extract club ID from multiple possible fields
  const getClubId = (club: any): number | null => {
    if (!club) return null;
    const clubId = club.id || club.clubId || club.club_id;
    if (clubId == null) return null;
    const numId = typeof clubId === 'string' ? parseInt(clubId, 10) : Number(clubId);
    return isNaN(numId) ? null : numId;
  };

  // Helper function to extract fee club ID
  const getFeeClubId = (fee: any): number | null => {
    if (!fee) return null;
    const clubId = fee.club?.id || fee.clubId || fee.club_id || fee.club?.clubId || fee.club?.club_id;
    if (clubId == null) return null;
    const numId = typeof clubId === 'string' ? parseInt(clubId, 10) : Number(clubId);
    return isNaN(numId) ? null : numId;
  };

  // Helper function to extract amount from multiple possible fields
  const getFeeAmount = (fee: any): number => {
    return fee.amount || fee.feeAmount || fee.fee || fee.total || 0;
  };

  // Helper function to extract status from multiple possible fields
  const getFeeStatus = (fee: any): string | null => {
    return fee.status || fee.paymentStatus || fee.payment_status || null;
  };

  const loadData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // Load fees for this student
      const feesResponse = await feeApi.getByStudent(user.id).catch((err) => {
        return [];
      });

      // Handle different response formats
      let feesList: any[] = [];
      if (Array.isArray(feesResponse)) {
        feesList = feesResponse.filter(f => f && f.id);
      } else {
        feesList = extractCollection<any>(feesResponse) || [];
      }

      // Load joined clubs to enhance fee data with club info
      const joinedClubsRes = await studentApi.getClubs(user.id).catch((err) => {
        return { _embedded: { responseClubDtoList: [] } };
      });

      const clubsList = extractCollection<any>(joinedClubsRes) || [];
      setJoinedClubs(clubsList);

      // Create a map of club IDs to club objects for quick lookup
      const clubMap: Record<number, any> = {};
      clubsList.forEach(club => {
        const clubId = getClubId(club);
        if (clubId != null) {
          clubMap[clubId] = {
            id: clubId,
            title: club.title || club.name,
            name: club.name || club.title,
            ...club,
          };
        }
      });

      // Enhance fees with club information
      const enhancedFees = feesList.map(fee => {
        const feeClubId = getFeeClubId(fee);
        
        // Try to find club from map
        if (feeClubId != null && clubMap[feeClubId]) {
          return {
            ...fee,
            club: clubMap[feeClubId],
            clubId: feeClubId,
            // Normalize amount and status
            amount: getFeeAmount(fee),
            status: getFeeStatus(fee),
          };
        }
        
        // If fee has club object directly, enrich it
        if (fee.club) {
          const clubId = getClubId(fee.club);
          return {
            ...fee,
            club: {
              id: clubId || fee.club.id,
              title: fee.club.title || fee.club.name,
              name: fee.club.name || fee.club.title,
              ...fee.club,
            },
            clubId: clubId || getFeeClubId(fee),
            amount: getFeeAmount(fee),
            status: getFeeStatus(fee),
          };
        }
        
        // Return fee with normalized amount and status
        return {
          ...fee,
          amount: getFeeAmount(fee),
          status: getFeeStatus(fee),
        };
      });

      setAllFees(enhancedFees);
      setFees(enhancedFees);
    } catch (error: any) {
      if (error?.status !== 403) {
        toast.error('Failed to load fees. Please try again.');
      }
      setFees([]);
      setAllFees([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to extract date from multiple possible fields
  const getFeeDate = (fee: any): Date | null => {
    const dateStr = fee.createdAt || fee.created_at || fee.paymentDate || fee.payment_date || fee.date || fee.paidDate || fee.paid_date;
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  const filteredFees = useMemo(() => {
    let filtered = allFees.filter(fee => fee && fee.id);

    // Filter by status - use robust status extraction
    if (filterStatus !== 'all') {
      filtered = filtered.filter(fee => {
        const status = getFeeStatus(fee);
        return status?.toUpperCase() === filterStatus.toUpperCase();
      });
    }

    // Filter by club - use robust club ID matching
    if (filterClubId !== 'all') {
      const clubIdNum = parseInt(filterClubId);
      if (!isNaN(clubIdNum)) {
        filtered = filtered.filter(fee => {
          const feeClubId = getFeeClubId(fee);
          // Try both exact match and type-coerced match
          return feeClubId != null && (
            feeClubId === clubIdNum ||
            Number(feeClubId) === Number(clubIdNum) ||
            String(feeClubId) === String(clubIdNum)
          );
        });
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fee => {
        const purpose = (fee.purpose || fee.description || '').toLowerCase();
        const clubName = (fee.club?.title || fee.club?.name || '').toLowerCase();
        const amount = getFeeAmount(fee).toString();
        return purpose.includes(query) || clubName.includes(query) || amount.includes(query);
      });
    }

    // Sort by date (newest first) - use robust date extraction
    return filtered.sort((a, b) => {
      const dateA = getFeeDate(a);
      const dateB = getFeeDate(b);
      
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return dateB.getTime() - dateA.getTime();
    });
  }, [allFees, filterStatus, filterClubId, searchQuery]);

  // Calculate status counts - use robust status extraction
  const statusCounts = useMemo(() => {
    const validFees = allFees.filter(f => f && f.id);
    return {
      all: validFees.length,
      paid: validFees.filter(f => {
        const status = getFeeStatus(f);
        return status?.toUpperCase() === 'PAID';
      }).length,
      pending: validFees.filter(f => {
        const status = getFeeStatus(f);
        return status?.toUpperCase() === 'PENDING';
      }).length,
      failed: validFees.filter(f => {
        const status = getFeeStatus(f);
        return status?.toUpperCase() === 'FAILED';
      }).length,
    };
  }, [allFees]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight neon-text text-white">
            Fees & Payments
          </h1>
          <p className="text-muted-foreground mt-1">
            View your fee records and payment status
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {allFees.length} {allFees.length === 1 ? 'Record' : 'Records'}
        </Badge>
      </div>

      {/* Summary */}
      <FeeSummary fees={allFees} />

      {/* Filters */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses ({statusCounts.all})</SelectItem>
                <SelectItem value="PAID">Paid ({statusCounts.paid})</SelectItem>
                <SelectItem value="PENDING">Pending ({statusCounts.pending})</SelectItem>
                <SelectItem value="FAILED">Failed ({statusCounts.failed})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterClubId} onValueChange={setFilterClubId}>
              <SelectTrigger>
                <SelectValue placeholder="All Clubs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {joinedClubs.map((club) => {
                  const clubId = getClubId(club);
                  if (!clubId) return null;
                  return (
                    <SelectItem key={clubId} value={clubId.toString()}>
                      {club.title || club.name || `Club ${clubId}`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Fees Display */}
      {filteredFees.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Fees Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterClubId !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'No fee records found.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredFees.map((fee) => (
            <PaymentStatusCard key={fee.id} fee={fee} />
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentFees;
