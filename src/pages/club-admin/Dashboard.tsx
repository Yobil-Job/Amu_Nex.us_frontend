import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, Sparkles, Activity } from 'lucide-react';
import { clubApi, eventApi, announcementApi, authorityApi, feeApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { loadManagedClubsForUser } from '@/lib/clubAdminUtils';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import StatsCards from '@/components/club-admin/StatsCards';
import MemberGrowthChart from '@/components/club-admin/MemberGrowthChart';
import EventsChart from '@/components/club-admin/EventsChart';
import FeesChart from '@/components/club-admin/FeesChart';
import QuickActionsPanel from '@/components/club-admin/QuickActionsPanel';

const ClubAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [managedClubs, setManagedClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalAuthorities: 0,
    upcomingEvents: 0,
    totalAnnouncements: 0,
    feesCollected: 0,
    isLoading: true,
  });

  const [members, setMembers] = useState<any[]>([]);
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadManagedClubs();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClub?.id) {
      loadDashboardData();
      setLogoError(false); // Reset logo error when club changes
    }
  }, [selectedClub?.id]);

  // Load clubs where user is assigned as club admin (ADMIN role)
  const loadManagedClubs = async () => {
    if (!user?.id) return;
    
    try {
      const clubs = await loadManagedClubsForUser(user.id);

      if (clubs.length === 0) {
        toast.info('You are not assigned as a club admin for any club yet. Please contact the system administrator to assign you as a club admin.');
        setStats((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      setManagedClubs(clubs);

      // Auto-select first club if only one, or prompt selection
      if (clubs.length === 1) {
        setSelectedClub(clubs[0]);
      } else if (clubs.length > 1) {
        // Select the first club (club selector will be shown in UI)
        setSelectedClub(clubs[0]);
      }
    } catch (error: any) {
      console.error('Failed to load managed clubs:', error);
      toast.error('Failed to load your clubs');
      setStats((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const loadDashboardData = async () => {
    if (!selectedClub?.id) return;

    setStats((prev) => ({ ...prev, isLoading: true }));

    try {
      const clubId = selectedClub.id;

      // Load all data in parallel
          const [
            membersRes,
            authoritiesRes,
            eventsRes,
            announcementsRes,
            feesRes,
            requestsRes,
          ] = await Promise.all([
            clubApi.getMembers(clubId).catch(() => ({ _embedded: { studentResponseDtoList: [] } })),
            authorityApi.getByClub(clubId).catch(() => ({ _embedded: { authorityResponseDtoList: [] } })),
            eventApi.getByClub(clubId).catch(() => ({ _embedded: { eventList: [] } })),
            announcementApi.getByClub(clubId).catch(() => ({ _embedded: { announcementResponseDtoList: [] } })),
            feeApi.getByClub(clubId).catch(() => ({ _embedded: { feeResponseDtoList: [] } })),
            clubApi.getPendingRequests(clubId).catch(() => ({ _embedded: { requestResponseDtoList: [] } })),
          ]);

          const membersList = extractCollection<any>(membersRes) || [];
          const authoritiesList = extractCollection<any>(authoritiesRes) || [];
          const eventsList = extractCollection<any>(eventsRes) || [];
          const announcementsList = extractCollection<any>(announcementsRes) || [];
          const feesList = extractCollection<any>(feesRes) || [];
          const requestsList = extractCollection<any>(requestsRes) || [];

          setMembers(membersList);
          setAuthorities(authoritiesList);
          setEvents(eventsList);
          setAnnouncements(announcementsList);
          setFees(feesList);
          setPendingRequestsCount(requestsList.length);

          // Debug logging
          if (import.meta.env.DEV) {
            console.log('📊 Dashboard Data Loaded:', {
              members: membersList.length,
              authorities: authoritiesList.length,
              events: eventsList.length,
              announcements: announcementsList.length,
              fees: feesList.length,
              pendingRequests: requestsList.length,
              sampleEvent: eventsList[0],
              sampleMember: membersList[0],
              sampleFee: feesList[0],
            });
          }

      // Calculate upcoming events (events after today) - check multiple date fields
      const now = new Date();
      const upcomingEventsCount = eventsList.filter((event: any) => {
        try {
          // Check multiple possible date fields
          const eventDateStr = event.startAt || event.startDate || event.date || event.start;
          if (!eventDateStr) return false;
          
          const eventDate = new Date(eventDateStr);
          if (isNaN(eventDate.getTime())) return false;
          
          return eventDate > now;
        } catch {
          return false;
        }
      }).length;

      // Calculate total fees collected - check multiple amount fields and only count PAID fees
      const totalFees = feesList.reduce((sum: number, fee: any) => {
        // Only count fees with PAID status
        const status = (fee.status || '').toUpperCase();
        if (status !== 'PAID') return sum;
        
        // Check multiple possible amount fields
        const amount = fee.amount || fee.feeAmount || fee.fee || fee.total || 0;
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
        return sum + (isNaN(numAmount) ? 0 : numAmount);
      }, 0);

      setStats({
        totalMembers: membersList.length,
        totalAuthorities: authoritiesList.length,
        upcomingEvents: upcomingEventsCount,
        totalAnnouncements: announcementsList.length,
        feesCollected: totalFees,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setStats((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Dashboard' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {selectedClub?.logo && !logoError ? (
            <img
              src={selectedClub.logo}
              alt={selectedClub.title || selectedClub.name || 'Club Logo'}
              className="h-16 w-16 rounded-full object-cover border-2 border-primary/30 shadow-lg"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-primary shadow-colored-primary flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary animate-float" />
              Club Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedClub
                ? `Managing ${selectedClub.title || selectedClub.name || 'Club'}`
                : 'Select a club to manage'}
            </p>
          </div>
        </div>

        {/* Club Selector (if managing multiple clubs) */}
        {managedClubs.length > 1 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedClub?.id || ''}
              onChange={(e) => {
                const club = managedClubs.find((c) => c.id === Number(e.target.value));
                setSelectedClub(club || null);
              }}
              className="glass-card border-primary/20 px-4 py-2 rounded-lg bg-background text-white"
            >
              {managedClubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.title || club.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="luxury-divider"></div>

      {!selectedClub ? (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-12 text-center">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No Club Assigned</h3>
            <p className="text-muted-foreground">
              You are not assigned as a club admin for any club yet. Please contact the system administrator.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <StatsCards stats={stats} isLoading={stats.isLoading} />

          {/* Charts Row */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <MemberGrowthChart members={members} isLoading={stats.isLoading} />
            <EventsChart events={events} isLoading={stats.isLoading} />
          </div>

          {/* Fees Chart */}
          <FeesChart fees={fees} isLoading={stats.isLoading} />

          {/* Quick Actions & Recent Activity */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <QuickActionsPanel
                  clubId={selectedClub.id}
                  pendingRequestsCount={pendingRequestsCount}
                />
              </div>
        </>
      )}
    </div>
  );
};

export default ClubAdminDashboard;

