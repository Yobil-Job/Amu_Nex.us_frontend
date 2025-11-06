import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, Sparkles, Activity } from 'lucide-react';
import { clubApi, eventApi, announcementApi, authorityApi, feeApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
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

  useEffect(() => {
    if (user?.id) {
      loadManagedClubs();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClub?.id) {
      loadDashboardData();
    }
  }, [selectedClub?.id]);

  // Load clubs where user is assigned as club admin (ADMIN role)
  const loadManagedClubs = async () => {
    try {
      // Get all authorities for the current user
      const authoritiesRes = await authorityApi.getAll().catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
      const allAuthorities = extractCollection<any>(authoritiesRes) || [];

      console.log('All authorities:', allAuthorities);
      console.log('Current user ID:', user?.id);

      // Filter authorities where user is the club admin (ADMIN role)
      // Authority has studentId (the club admin) and clubId (the club they manage)
      // In backend, authority name 'ADMIN' means club admin role
      const userAuthorities = allAuthorities.filter((auth: any) => {
        const studentId = auth.student?.id || auth.studentId;
        const authName = (auth.name || '').toUpperCase();
        // Check if user is assigned as club admin (ADMIN role) for this club
        const matches = studentId === user?.id && authName === 'ADMIN';
        if (matches) {
          console.log('Found matching authority:', auth);
        }
        return matches;
      });

      console.log('User authorities:', userAuthorities);

      // Get unique club IDs
      const clubIds = [...new Set(userAuthorities.map((auth: any) => auth.club?.id || auth.clubId))].filter(Boolean);

      console.log('Club IDs found:', clubIds);

      if (clubIds.length === 0) {
        // If no authorities found, try alternative approach: check if user is a member of any clubs
        // and has role ADMIN (they might be club admin without explicit authority record)
        try {
          const allClubsRes = await clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } }));
          const allClubs = extractCollection<any>(allClubsRes) || [];
          
          // For each club, check if user is a member
          const memberPromises = allClubs.map(async (club: any) => {
            try {
              const membersRes = await clubApi.getMembers(club.id).catch(() => ({ _embedded: { studentResponseDtoList: [] } }));
              const members = extractCollection<any>(membersRes) || [];
              const isMember = members.some((m: any) => m.id === user?.id);
              return isMember ? club : null;
            } catch {
              return null;
            }
          });
          
          const memberClubs = (await Promise.all(memberPromises)).filter(Boolean);
          
          if (memberClubs.length > 0) {
            // User is a member of clubs, but not assigned as admin via authorities
            // This might mean they need to be assigned by system admin
            console.log('User is member of clubs but not assigned as admin:', memberClubs);
          }
        } catch (err) {
          console.error('Error checking club membership:', err);
        }
        
        toast.info('You are not assigned as a club admin for any club yet. Please contact the system administrator to assign you as a club admin.');
        setStats((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Fetch club details for each club ID
      const clubPromises = clubIds.map(async (clubId: number) => {
        try {
          const club = await clubApi.getById(clubId);
          return club;
        } catch {
          return null;
        }
      });

      const clubs = (await Promise.all(clubPromises)).filter(Boolean);
      setManagedClubs(clubs);

      // Auto-select first club if only one, or prompt selection
      if (clubs.length === 1) {
        setSelectedClub(clubs[0]);
      } else if (clubs.length > 1) {
        // For now, select the first club (can be enhanced to show club selector)
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
      ] = await Promise.all([
        clubApi.getMembers(clubId).catch(() => ({ _embedded: { studentResponseDtoList: [] } })),
        authorityApi.getByClub(clubId).catch(() => ({ _embedded: { authorityResponseDtoList: [] } })),
        eventApi.getByClub(clubId).catch(() => ({ _embedded: { eventList: [] } })),
        announcementApi.getByClub(clubId).catch(() => ({ _embedded: { announcementResponseDtoList: [] } })),
        feeApi.getByClub(clubId).catch(() => ({ _embedded: { feeResponseDtoList: [] } })),
      ]);

      const membersList = extractCollection<any>(membersRes) || [];
      const authoritiesList = extractCollection<any>(authoritiesRes) || [];
      const eventsList = extractCollection<any>(eventsRes) || [];
      const announcementsList = extractCollection<any>(announcementsRes) || [];
      const feesList = extractCollection<any>(feesRes) || [];

      setMembers(membersList);
      setAuthorities(authoritiesList);
      setEvents(eventsList);
      setAnnouncements(announcementsList);
      setFees(feesList);

      // Calculate upcoming events (events after today)
      const now = new Date();
      const upcomingEventsCount = eventsList.filter((event: any) => {
        try {
          if (!event.startAt) return false;
          const eventDate = new Date(event.startAt);
          return eventDate > now;
        } catch {
          return false;
        }
      }).length;

      // Calculate total fees collected
      const totalFees = feesList.reduce((sum: number, fee: any) => {
        return sum + (fee.amount || 0);
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
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
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
              pendingRequestsCount={0} // Will be calculated when we implement join requests
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ClubAdminDashboard;

