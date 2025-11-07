import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Plus, RefreshCw, Search, X, FileText, Clock, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { feeApi, clubApi, authorityApi, eventApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import FinanceOverview from '@/components/super-user/FinanceOverview';
import IncomeExpenseForm, { loadFinanceRecords, saveFinanceRecord } from '@/components/super-user/IncomeExpenseForm';
import FinanceRequestsList, { loadFinanceRequests, updateFinanceRequestStatus } from '@/components/super-user/FinanceRequestsList';
import FinanceChart from '@/components/super-user/FinanceChart';
import FinanceReportDialog from '@/components/super-user/FinanceReportDialog';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import EmptyState from '@/components/admin/EmptyState';

const SuperUserFinance = () => {
  const { user } = useAuth();
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [financeRecords, setFinanceRecords] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'requests'>('overview');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserClub();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClub?.id) {
      loadData();
    }
  }, [selectedClub?.id]);

  // Load user's club (SUPER_USER has authorities assigned by club admin)
  const loadUserClub = async () => {
    try {
      const authoritiesRes = await authorityApi.getByStudent(user?.id || 0).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
      const allAuthorities = extractCollection<any>(authoritiesRes) || [];

      const userAuthorities = allAuthorities.filter((auth: any) => {
        const studentId = auth.student?.id || auth.studentId;
        return studentId === user?.id;
      });

      if (userAuthorities.length === 0) {
        toast.info('You are not assigned as an authority for any club yet. Please contact your club admin.');
        setIsLoading(false);
        return;
      }

      const clubId = userAuthorities[0]?.club?.id || userAuthorities[0]?.clubId;
      if (clubId) {
        try {
          const club = await clubApi.getById(clubId);
          setSelectedClub(club);
        } catch (error) {
          console.error('Failed to load club:', error);
          toast.error('Failed to load club information');
          setIsLoading(false);
        }
      }
    } catch (error: any) {
      console.error('Failed to load authorities:', error);
      toast.error('Failed to load your club information');
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    if (!selectedClub?.id) return;

    setIsLoading(true);
    try {
      // Load fees (income source)
      const feesRes = await feeApi.getByClub(selectedClub.id).catch(() => []);
      const feesList = Array.isArray(feesRes) ? feesRes : extractCollection<any>(feesRes) || [];
      setFees(feesList);

      // Load events (for linking expenses)
      const eventsRes = await eventApi.getByClub(selectedClub.id).catch(() => ({ _embedded: { eventList: [] } }));
      const eventsList = extractCollection<any>(eventsRes) || [];
      setEvents(eventsList);

      // Load finance records (income/expenses) from localStorage (mock)
      const records = loadFinanceRecords(selectedClub.id);
      setFinanceRecords(records);

      // Load finance requests from localStorage (mock)
      const requestsList = loadFinanceRequests(selectedClub.id);
      setRequests(requestsList);
    } catch (error: any) {
      toast.error('Failed to load financial data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals from fees and finance records
  const financeStats = useMemo(() => {
    // Income from fees (paid fees only)
    const feesIncome = fees
      .filter((fee) => (fee.status || '').toUpperCase() === 'PAID')
      .reduce((sum, fee) => sum + (parseFloat(fee.amount || fee.feeAmount || '0') || 0), 0);

    // Income from finance records
    const recordsIncome = financeRecords
      .filter((r) => r.type === 'income' || (r.amount && r.amount > 0))
      .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount || '0') || 0), 0);

    // Expenses from finance records
    const expenses = financeRecords
      .filter((r) => r.type === 'expense' || (r.amount && r.amount < 0))
      .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount || '0') || 0), 0);

    const totalIncome = feesIncome + recordsIncome;
    const balance = totalIncome - expenses;

    return {
      income: totalIncome,
      expenses,
      balance,
    };
  }, [fees, financeRecords]);

  // Filter finance records
  const filteredRecords = useMemo(() => {
    let filtered = [...financeRecords];

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((record) => {
        if (typeFilter === 'income') {
          return record.type === 'income' || (record.amount && record.amount > 0);
        } else {
          return record.type === 'expense' || (record.amount && record.amount < 0);
        }
      });
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((record) => record.category === categoryFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((record) => {
        const description = (record.description || '').toLowerCase();
        const category = (record.category || '').toLowerCase();
        return description.includes(query) || category.includes(query);
      });
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
  }, [financeRecords, typeFilter, categoryFilter, searchQuery]);

  // Get unique categories
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    financeRecords.forEach((record) => {
      if (record.category) {
        categorySet.add(record.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [financeRecords]);

  const handleRecordSuccess = () => {
    loadData();
  };

  const handleApproveRequest = async (request: any) => {
    try {
      // Update request status
      updateFinanceRequestStatus(request.id, 'APPROVED');

      // If it's an expense request, create a finance record
      if (request.type === 'expense') {
        saveFinanceRecord({
          clubId: selectedClub.id,
          type: 'expense',
          amount: -Math.abs(request.amount),
          description: request.description,
          category: request.category || 'OTHER',
          date: new Date().toISOString().split('T')[0],
          eventId: request.eventId || null,
          receiptNumber: request.receiptNumber || null,
          notes: `Approved request from ${request.requestedBy?.name || request.requestedByName || 'member'}`,
        });
      }

      toast.success('Finance request approved');
      loadData();
    } catch (error: any) {
      toast.error('Failed to approve request');
    }
  };

  const handleRejectRequest = (request: any) => {
    try {
      updateFinanceRequestStatus(request.id, 'REJECTED');
      toast.success('Finance request rejected');
      loadData();
    } catch (error: any) {
      toast.error('Failed to reject request');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch {
      try {
        const date = new Date(dateString);
        return format(date, 'MMM dd, yyyy');
      } catch {
        return dateString;
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Finance' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <DollarSign className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Financial Management
              {requests.length > 0 && (
                <Badge className="bg-accent text-accent-foreground">
                  {requests.length} Requests
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedClub
                ? `Manage finances for ${selectedClub.title || selectedClub.name || 'Club'}`
                : 'Manage club finances and expenses'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedClub && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportDialogOpen(true)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Generate Report
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setFormDialogOpen(true)}
                className="gap-2 purple-gold-gradient"
              >
                <Plus className="h-4 w-4" />
                Record Transaction
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading || !selectedClub}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="luxury-divider"></div>

      {!selectedClub ? (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-12 text-center">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No Club Assigned</h3>
            <p className="text-muted-foreground">
              You are not assigned as an authority for any club yet. Please contact your club admin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Finance Overview */}
          <FinanceOverview
            income={financeStats.income}
            expenses={financeStats.expenses}
            balance={financeStats.balance}
            isLoading={isLoading}
          />

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'records' | 'requests')}>
            <TabsList className="glass-card border-primary/20">
              <TabsTrigger value="overview" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Overview & Charts
              </TabsTrigger>
              <TabsTrigger value="records" className="gap-2">
                <ArrowDownCircle className="h-4 w-4" />
                Income & Expenses
              </TabsTrigger>
              <TabsTrigger value="requests" className="gap-2">
                <Clock className="h-4 w-4" />
                Finance Requests
                {requests.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {requests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Finance Chart */}
              <FinanceChart records={financeRecords} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="records" className="mt-6 space-y-6">
              {/* Filters */}
              <Card className="glass-card border-primary/20">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by description or category..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-10 glass-card border-primary/20"
                        />
                        {searchQuery && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setSearchQuery('')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as 'all' | 'income' | 'expense')}
                        className="glass-card border-primary/20 px-3 py-2 rounded-lg bg-background text-white text-sm"
                      >
                        <option value="all">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expenses</option>
                      </select>

                      {categories.length > 0 && (
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="glass-card border-primary/20 px-3 py-2 rounded-lg bg-background text-white text-sm"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Finance Records Table */}
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Financial Records ({filteredRecords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredRecords.length === 0 ? (
                    <EmptyState
                      icon={DollarSign}
                      title="No Financial Records"
                      description={
                        searchQuery || typeFilter !== 'all' || categoryFilter !== 'all'
                          ? "Try adjusting your filters to see more results"
                          : "No income or expense records found. Record your first transaction to get started."
                      }
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-primary/20">
                            <TableHead className="text-white">Date</TableHead>
                            <TableHead className="text-white">Type</TableHead>
                            <TableHead className="text-white">Category</TableHead>
                            <TableHead className="text-white">Description</TableHead>
                            <TableHead className="text-white">Amount</TableHead>
                            <TableHead className="text-white">Event</TableHead>
                            <TableHead className="text-white">Receipt</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRecords.map((record) => {
                            const isIncome = record.type === 'income' || (record.amount && record.amount > 0);
                            const amount = Math.abs(parseFloat(record.amount || '0') || 0);
                            const event = events.find((e) => e.id === record.eventId);

                            return (
                              <TableRow
                                key={record.id}
                                className="border-primary/20 hover:bg-primary/10 transition-colors"
                              >
                                <TableCell className="text-white">
                                  {formatDate(record.date || record.createdAt)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      isIncome
                                        ? 'bg-success/10 text-success border-success/30'
                                        : 'bg-destructive/10 text-destructive border-destructive/30'
                                    }
                                  >
                                    {isIncome ? (
                                      <ArrowUpCircle className="h-3 w-3 mr-1" />
                                    ) : (
                                      <ArrowDownCircle className="h-3 w-3 mr-1" />
                                    )}
                                    {isIncome ? 'Income' : 'Expense'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-white">
                                  {record.category?.replace(/_/g, ' ') || 'N/A'}
                                </TableCell>
                                <TableCell className="text-white">
                                  {record.description || 'N/A'}
                                </TableCell>
                                <TableCell
                                  className={`font-semibold ${
                                    isIncome ? 'text-success' : 'text-destructive'
                                  }`}
                                >
                                  {isIncome ? '+' : '-'}
                                  {formatCurrency(amount)}
                                </TableCell>
                                <TableCell className="text-white">
                                  {event ? (
                                    <span className="text-sm">{event.title}</span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-white">
                                  {record.receiptNumber ? (
                                    <span className="text-sm font-mono">{record.receiptNumber}</span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests" className="mt-6">
              <FinanceRequestsList
                requests={requests}
                isLoading={isLoading}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Modals */}
      <IncomeExpenseForm
        clubId={selectedClub?.id || 0}
        isOpen={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        onSuccess={handleRecordSuccess}
        events={events}
      />

      <FinanceReportDialog
        clubId={selectedClub?.id || 0}
        records={financeRecords}
        events={events}
        isOpen={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
      />
    </div>
  );
};

export default SuperUserFinance;

