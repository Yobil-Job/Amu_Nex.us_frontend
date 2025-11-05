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

  const loadData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // Load fees for this student
      const feesResponse = await feeApi.getByStudent(user.id).catch((err) => {
        console.warn('Failed to load fees:', err);
        // Handle different response formats
        if (Array.isArray(err)) {
          return [];
        }
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
        console.warn('Failed to load joined clubs:', err);
        return { _embedded: { responseClubDtoList: [] } };
      });

      const clubsList = extractCollection<any>(joinedClubsRes) || [];
      setJoinedClubs(clubsList);

      // Create a map of club IDs to club objects for quick lookup
      const clubMap: Record<number, any> = {};
      clubsList.forEach(club => {
        if (club && club.id) {
          clubMap[club.id] = club;
        }
      });

      // Enhance fees with club information
      const enhancedFees = feesList.map(fee => {
        if (fee.clubId && clubMap[fee.clubId]) {
          return {
            ...fee,
            club: clubMap[fee.clubId],
          };
        }
        // If fee has club object directly, keep it
        if (fee.club) {
          return fee;
        }
        return fee;
      });

      setAllFees(enhancedFees);
      setFees(enhancedFees);
    } catch (error: any) {
      console.error('Failed to load fees:', error);
      if (error?.status !== 403) {
        toast.error('Failed to load fees. Please try again.');
      }
      setFees([]);
      setAllFees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFees = useMemo(() => {
    let filtered = allFees.filter(fee => fee && fee.id);

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(fee =>
        fee.status?.toUpperCase() === filterStatus.toUpperCase()
      );
    }

    // Filter by club
    if (filterClubId !== 'all') {
      const clubIdNum = parseInt(filterClubId);
      if (!isNaN(clubIdNum)) {
        filtered = filtered.filter(fee => {
          const feeClubId = fee.club?.id || fee.clubId;
          return feeClubId === clubIdNum;
        });
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fee => {
        const purpose = (fee.purpose || '').toLowerCase();
        const clubName = (fee.club?.title || fee.club?.name || '').toLowerCase();
        const amount = (fee.amount || 0).toString();
        return purpose.includes(query) || clubName.includes(query) || amount.includes(query);
      });
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      try {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } catch {
        return 0;
      }
    });
  }, [allFees, filterStatus, filterClubId, searchQuery]);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const validFees = allFees.filter(f => f && f.id);
    return {
      all: validFees.length,
      paid: validFees.filter(f => f.status?.toUpperCase() === 'PAID').length,
      pending: validFees.filter(f => f.status?.toUpperCase() === 'PENDING').length,
      failed: validFees.filter(f => f.status?.toUpperCase() === 'FAILED').length,
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
                {joinedClubs.map((club) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.title || club.name || `Club ${club.id}`}
                  </SelectItem>
                ))}
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
