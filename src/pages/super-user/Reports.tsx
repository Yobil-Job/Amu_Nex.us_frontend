import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText, Building2, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { clubApi, authorityApi, eventApi, feeApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import ReportGenerator from '@/components/super-user/ReportGenerator';
import InsightsCharts from '@/components/super-user/InsightsCharts';
import ExportReportButton from '@/components/super-user/ExportReportButton';
import { loadFinanceRecords } from '@/components/super-user/IncomeExpenseForm';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import EmptyState from '@/components/admin/EmptyState';

const SuperUserReports = () => {
  const { user } = useAuth();
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [financeRecords, setFinanceRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);

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
      // Load members
      const membersRes = await clubApi.getMembers(selectedClub.id).catch(() => ({ _embedded: { studentResponseDtoList: [] } }));
      const membersList = extractCollection<any>(membersRes) || [];
      setMembers(membersList);

      // Load events
      const eventsRes = await eventApi.getByClub(selectedClub.id).catch(() => ({ _embedded: { eventList: [] } }));
      const eventsList = extractCollection<any>(eventsRes) || [];
      setEvents(eventsList);

      // Load fees
      const feesRes = await feeApi.getByClub(selectedClub.id).catch(() => []);
      const feesList = Array.isArray(feesRes) ? feesRes : extractCollection<any>(feesRes) || [];
      setFees(feesList);

      // Load finance records
      const records = loadFinanceRecords(selectedClub.id);
      setFinanceRecords(records);
    } catch (error: any) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async (reportType: string, dateRange: { start: Date; end: Date }) => {
    setIsGenerating(true);
    setSelectedReportType(reportType);
    setSelectedDateRange(dateRange);

    try {
      // Filter data by date range
      const filteredMembers = members.filter((member) => {
        const joinDate = member.joinedAt || member.createdAt || member.registrationDate;
        if (!joinDate) return false;
        const date = new Date(joinDate);
        return date >= dateRange.start && date <= dateRange.end;
      });

      const filteredEvents = events.filter((event) => {
        const eventDate = event.startTime || event.date || event.createdAt;
        if (!eventDate) return false;
        const date = new Date(eventDate);
        return date >= dateRange.start && date <= dateRange.end;
      });

      const filteredFees = fees.filter((fee) => {
        const feeDate = fee.paidAt || fee.createdAt || fee.date;
        if (!feeDate) return false;
        const date = new Date(feeDate);
        return date >= dateRange.start && date <= dateRange.end;
      });

      const filteredFinanceRecords = financeRecords.filter((record) => {
        const recordDate = record.date || record.createdAt;
        if (!recordDate) return false;
        const date = new Date(recordDate);
        return date >= dateRange.start && date <= dateRange.end;
      });

      // Calculate report statistics
      const report: any = {
        totalMembers: members.length,
        newMembers: filteredMembers.length,
        membershipGrowthRate: members.length > 0 ? (filteredMembers.length / members.length) * 100 : 0,
        totalEvents: filteredEvents.length,
        upcomingEvents: filteredEvents.filter((e) => {
          const eventDate = new Date(e.startTime || e.date || e.createdAt);
          return eventDate > new Date();
        }).length,
        pastEvents: filteredEvents.filter((e) => {
          const eventDate = new Date(e.startTime || e.date || e.createdAt);
          return eventDate <= new Date();
        }).length,
        totalParticipants: filteredEvents.reduce((sum, e) => {
          return sum + (parseInt(e.participantsCount || e.participationCount || '0') || 0);
        }, 0),
        avgParticipants: filteredEvents.length > 0
          ? filteredEvents.reduce((sum, e) => {
              return sum + (parseInt(e.participantsCount || e.participationCount || '0') || 0);
            }, 0) / filteredEvents.length
          : 0,
      };

      // Financial data
      const paidFees = filteredFees.filter((fee) => (fee.status || '').toUpperCase() === 'PAID');
      const totalFeesCollected = paidFees.reduce((sum, fee) => {
        return sum + (parseFloat(fee.amount || fee.feeAmount || '0') || 0);
      }, 0);

      const totalIncome = financeRecords
        .filter((r) => r.type === 'income' || (r.amount && r.amount > 0))
        .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount || '0') || 0), 0) + totalFeesCollected;

      const totalExpenses = financeRecords
        .filter((r) => r.type === 'expense' || (r.amount && r.amount < 0))
        .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount || '0') || 0), 0);

      report.totalIncome = totalIncome;
      report.totalExpenses = totalExpenses;
      report.netProfit = totalIncome - totalExpenses;
      report.totalFeesCollected = totalFeesCollected;

      // Monthly breakdown
      const monthlyBreakdown: any[] = [];
      const months = [];
      let currentDate = new Date(dateRange.start);
      while (currentDate <= dateRange.end) {
        months.push(new Date(currentDate));
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }

      months.forEach((month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        const monthMembers = members.filter((m) => {
          const joinDate = m.joinedAt || m.createdAt || m.registrationDate;
          if (!joinDate) return false;
          const date = new Date(joinDate);
          return date >= monthStart && date <= monthEnd;
        }).length;

        const monthIncome = financeRecords
          .filter((r) => {
            const recordDate = new Date(r.date || r.createdAt);
            return recordDate >= monthStart && recordDate <= monthEnd && (r.type === 'income' || (r.amount && r.amount > 0));
          })
          .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount || '0') || 0), 0);

        const monthExpenses = financeRecords
          .filter((r) => {
            const recordDate = new Date(r.date || r.createdAt);
            return recordDate >= monthStart && recordDate <= monthEnd && (r.type === 'expense' || (r.amount && r.amount < 0));
          })
          .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount || '0') || 0), 0);

        const monthEvents = events.filter((e) => {
          const eventDate = new Date(e.startTime || e.date || e.createdAt);
          return eventDate >= monthStart && eventDate <= monthEnd;
        }).length;

        const monthParticipants = events
          .filter((e) => {
            const eventDate = new Date(e.startTime || e.date || e.createdAt);
            return eventDate >= monthStart && eventDate <= monthEnd;
          })
          .reduce((sum, e) => sum + (parseInt(e.participantsCount || e.participationCount || '0') || 0), 0);

        monthlyBreakdown.push({
          month: format(month, 'MMM yyyy'),
          newMembers: monthMembers,
          income: monthIncome,
          expenses: monthExpenses,
          events: monthEvents,
          participants: monthParticipants,
        });
      });

      report.monthlyBreakdown = monthlyBreakdown;

      setReportData(report);
      toast.success('Report generated successfully');
    } catch (error: any) {
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  // Summary stats
  const summaryStats = useMemo(() => {
    const paidFees = fees.filter((fee) => (fee.status || '').toUpperCase() === 'PAID');
    const totalFeesCollected = paidFees.reduce((sum, fee) => {
      return sum + (parseFloat(fee.amount || fee.feeAmount || '0') || 0);
    }, 0);

    const totalIncome = financeRecords
      .filter((r) => r.type === 'income' || (r.amount && r.amount > 0))
      .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount || '0') || 0), 0) + totalFeesCollected;

    const totalExpenses = financeRecords
      .filter((r) => r.type === 'expense' || (r.amount && r.amount < 0))
      .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount || '0') || 0), 0);

    const upcomingEvents = events.filter((e) => {
      const eventDate = new Date(e.startTime || e.date || e.createdAt);
      return eventDate > new Date();
    }).length;

    return {
      totalMembers: members.length,
      totalIncome,
      totalExpenses,
      upcomingEvents,
    };
  }, [members, fees, financeRecords, events]);

  const defaultDateRange = {
    start: startOfMonth(subMonths(new Date(), 5)),
    end: endOfMonth(new Date()),
  };

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Reports & Insights' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <FileText className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Reports & Insights
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedClub
                ? `Generate reports and view insights for ${selectedClub.title || selectedClub.name || 'Club'}`
                : 'View club reports and analytics'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {reportData && selectedDateRange && (
            <ExportReportButton
              reportData={reportData}
              reportType={selectedReportType}
              clubName={selectedClub?.title || selectedClub?.name || 'Club'}
              dateRange={selectedDateRange}
            />
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
          {/* Summary Stats */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Members</p>
                    <p className="text-2xl font-bold text-white">{summaryStats.totalMembers}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Income</p>
                    <p className="text-2xl font-bold text-white">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'ETB',
                        minimumFractionDigits: 0,
                      }).format(summaryStats.totalIncome)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-success/10">
                    <DollarSign className="h-6 w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-destructive/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-white">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'ETB',
                        minimumFractionDigits: 0,
                      }).format(summaryStats.totalExpenses)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/10">
                    <TrendingUp className="h-6 w-6 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-accent/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Upcoming Events</p>
                    <p className="text-2xl font-bold text-white">{summaryStats.upcomingEvents}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/10">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Generator */}
          <ReportGenerator
            clubId={selectedClub.id}
            clubName={selectedClub.title || selectedClub.name || 'Club'}
            onGenerate={handleGenerateReport}
            isGenerating={isGenerating}
          />

          {/* Insights Charts */}
          <InsightsCharts
            members={members}
            events={events}
            fees={fees}
            financeRecords={financeRecords}
            isLoading={isLoading}
            dateRange={selectedDateRange || defaultDateRange}
          />

          {/* Report Summary (if report generated) */}
          {reportData && (
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Report Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {(selectedReportType === 'COMPREHENSIVE' || selectedReportType === 'MEMBERSHIP') && (
                    <>
                      <div className="glass-card p-4 rounded border border-primary/10">
                        <p className="text-sm text-muted-foreground">Total Members</p>
                        <p className="text-2xl font-bold text-white">{reportData.totalMembers}</p>
                      </div>
                      <div className="glass-card p-4 rounded border border-primary/10">
                        <p className="text-sm text-muted-foreground">New Members (Period)</p>
                        <p className="text-2xl font-bold text-white">{reportData.newMembers}</p>
                      </div>
                      <div className="glass-card p-4 rounded border border-primary/10">
                        <p className="text-sm text-muted-foreground">Growth Rate</p>
                        <p className="text-2xl font-bold text-white">{reportData.membershipGrowthRate?.toFixed(2) || '0'}%</p>
                      </div>
                    </>
                  )}
                  {(selectedReportType === 'COMPREHENSIVE' || selectedReportType === 'FINANCIAL') && (
                    <>
                      <div className="glass-card p-4 rounded border border-primary/10">
                        <p className="text-sm text-muted-foreground">Total Income</p>
                        <p className="text-2xl font-bold text-white">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'ETB',
                            minimumFractionDigits: 0,
                          }).format(reportData.totalIncome || 0)}
                        </p>
                      </div>
                      <div className="glass-card p-4 rounded border border-primary/10">
                        <p className="text-sm text-muted-foreground">Total Expenses</p>
                        <p className="text-2xl font-bold text-white">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'ETB',
                            minimumFractionDigits: 0,
                          }).format(reportData.totalExpenses || 0)}
                        </p>
                      </div>
                      <div className="glass-card p-4 rounded border border-primary/10">
                        <p className="text-sm text-muted-foreground">Net Profit/Loss</p>
                        <p className={`text-2xl font-bold ${(reportData.netProfit || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'ETB',
                            minimumFractionDigits: 0,
                          }).format(reportData.netProfit || 0)}
                        </p>
                      </div>
                    </>
                  )}
                  {(selectedReportType === 'COMPREHENSIVE' || selectedReportType === 'EVENTS') && (
                    <>
                      <div className="glass-card p-4 rounded border border-primary/10">
                        <p className="text-sm text-muted-foreground">Total Events</p>
                        <p className="text-2xl font-bold text-white">{reportData.totalEvents}</p>
                      </div>
                      <div className="glass-card p-4 rounded border border-primary/10">
                        <p className="text-sm text-muted-foreground">Total Participants</p>
                        <p className="text-2xl font-bold text-white">{reportData.totalParticipants}</p>
                      </div>
                      <div className="glass-card p-4 rounded border border-primary/10">
                        <p className="text-sm text-muted-foreground">Avg Participants/Event</p>
                        <p className="text-2xl font-bold text-white">{reportData.avgParticipants?.toFixed(1) || '0'}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default SuperUserReports;

