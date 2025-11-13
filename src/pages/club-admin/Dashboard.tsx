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
    if (!user?.id) return;
    
    try {
      console.log('🔍 Loading managed clubs for user:', user.id, 'role:', user.role);

      // Strategy 1: Check authorities where user is assigned as ADMIN
      let clubIdsFromAuthorities: number[] = [];
      try {
        // First try to get authorities for this specific student (more efficient)
        const authoritiesRes = await authorityApi.getByStudent(user.id).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
        const userAuthorities = extractCollection<any>(authoritiesRes) || [];
        
        console.log('📊 User authorities:', userAuthorities.length, userAuthorities);

        // Filter authorities where user is the club admin (ADMIN role)
        // Authority has studentId (the club admin) and clubId (the club they manage)
        // In backend, authority name 'ADMIN' means club admin role
        const adminAuthorities = userAuthorities.filter((auth: any) => {
          const studentId = auth.student?.id || auth.studentId || auth.studentResponseDto?.id;
          const authName = (auth.name || auth.authority || '').toUpperCase();
          const isAdminAuth = authName === 'ADMIN' || authName === 'ROLE_ADMIN';
          const matchesUser = studentId === user.id || Number(studentId) === Number(user.id);
          
          console.log('🔍 Checking authority:', {
            studentId,
            authName,
            isAdminAuth,
            matchesUser,
            clubId: auth.club?.id || auth.clubId,
          });
          
          return matchesUser && isAdminAuth;
        });

        console.log('✅ Admin authorities found:', adminAuthorities.length);

        // Get unique club IDs from authorities
        clubIdsFromAuthorities = [...new Set(
          adminAuthorities.map((auth: any) => {
            const clubId = auth.club?.id || auth.clubId || auth.club?.clubId;
            return clubId != null ? Number(clubId) : null;
          }).filter((id): id is number => id != null)
        )];

        console.log('🏛️ Club IDs from authorities:', clubIdsFromAuthorities);
      } catch (err) {
        console.warn('Failed to load authorities:', err);
      }

      // Strategy 2: Check all clubs where clubAdminId matches user.id
      // This is the primary way club admins are stored in the backend
      // Note: clubAdminId might not be in the list response, so we fetch individual club details
      let clubsFromAdminId: any[] = [];
      try {
        const allClubsRes = await clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } }));
        const allClubs = extractCollection<any>(allClubsRes) || [];
        
        console.log('📊 All clubs loaded:', allClubs.length);
        
        // First, try to check clubAdminId in the list response (faster)
        const clubsFromList = allClubs.filter((club: any) => {
          const clubAdminId = club.clubAdminId || 
                             club.club_admin_id || 
                             club.clubAdmin?.id ||
                             club.clubAdminId?.id;
          
          if (clubAdminId == null) return false;
          
          return (
            Number(clubAdminId) === Number(user.id) ||
            clubAdminId === user.id ||
            String(clubAdminId) === String(user.id)
          );
        });

        if (clubsFromList.length > 0) {
          console.log('✅ Found clubs via list response:', clubsFromList.length);
          clubsFromAdminId = clubsFromList;
        } else {
          // clubAdminId not in list response, try two approaches:
          // 1. Fetch individual club details (clubAdminId might be there)
          // 2. Check club members to see if user is listed as admin
          console.log('🔍 clubAdminId not in list response, trying individual club details and members check...');
          
          const clubCheckPromises = allClubs.map(async (club: any) => {
            try {
              const clubId = club.id || club.clubId;
              if (!clubId) return null;
              
              // Approach 1: Check club details for clubAdminId
              const clubDetails = await clubApi.getById(clubId);
              
              // Check clubAdminId in detailed club object - try multiple field names
              const detailedClubAdminId = clubDetails.clubAdminId || 
                                         clubDetails.club_admin_id || 
                                         clubDetails.clubAdmin?.id ||
                                         clubDetails.clubAdminId?.id ||
                                         (typeof clubDetails.clubAdmin === 'number' ? clubDetails.clubAdmin : null);
              
              console.log('🔍 Club details for', clubId, ':', {
                clubTitle: clubDetails.title || clubDetails.name,
                clubAdminId: detailedClubAdminId,
                userId: user.id,
                clubDetailsKeys: Object.keys(clubDetails),
              });
              
              // Check if clubAdminId matches
              if (detailedClubAdminId != null && (
                Number(detailedClubAdminId) === Number(user.id) ||
                detailedClubAdminId === user.id ||
                String(detailedClubAdminId) === String(user.id)
              )) {
                console.log('✅ Found managed club via clubAdminId:', {
                  clubId: clubDetails.id,
                  clubTitle: clubDetails.title || clubDetails.name,
                  clubAdminId: detailedClubAdminId,
                });
                return clubDetails;
              }
              
              // Approach 2: Check club members to see if user is admin
              // Sometimes the user might be in the members list with admin privileges
              try {
                const membersRes = await clubApi.getMembers(clubId).catch(() => ({ _embedded: { studentResponseDtoList: [] } }));
                const members = extractCollection<any>(membersRes) || [];
                
                console.log('🔍 Checking members for club', clubId, ':', {
                  memberCount: members.length,
                  userId: user.id,
                });
                
                // Check if user is a member and has admin role or is the club admin
                const userMember = members.find((member: any) => {
                  const memberId = member.id || member.studentId || member.student?.id;
                  return memberId != null && (
                    Number(memberId) === Number(user.id) ||
                    memberId === user.id
                  );
                });
                
                if (userMember) {
                  console.log('🔍 User is a member of club', clubId, ':', {
                    memberId: userMember.id,
                    memberRole: userMember.role,
                    hasAdminRole: userMember.role === 'ADMIN' || userMember.role === 'ROLE_ADMIN',
                  });
                  
                  // Check if member has ADMIN role
                  const memberRole = userMember.role || userMember.authority?.authority;
                  const isAdminMember = memberRole === 'ADMIN' || 
                                      memberRole === 'ROLE_ADMIN' ||
                                      (typeof memberRole === 'string' && memberRole.toUpperCase().includes('ADMIN'));
                  
                  if (isAdminMember) {
                    console.log('✅ Found managed club via member role:', {
                      clubId: clubDetails.id,
                      clubTitle: clubDetails.title || clubDetails.name,
                      memberRole: memberRole,
                    });
                    return clubDetails;
                  }
                }
              } catch (memberErr) {
                console.warn(`Failed to check members for club ${clubId}:`, memberErr);
              }
              
              return null;
            } catch (err) {
              console.warn(`Failed to load club ${club.id} details:`, err);
              return null;
            }
          });
          
          const detailedClubs = (await Promise.all(clubCheckPromises)).filter(Boolean);
          if (detailedClubs.length > 0) {
            console.log('✅ Found clubs via individual club details/members check:', detailedClubs.length);
            clubsFromAdminId = detailedClubs;
          } else {
            console.warn('⚠️ No clubs found where user is admin, even after checking individual details and members');
          }
        }
      } catch (err) {
        console.warn('Failed to load clubs:', err);
      }

      // Combine both strategies - get unique club IDs
      const allClubIds = new Set<number>();
      
      // Add club IDs from authorities
      clubIdsFromAuthorities.forEach(id => allClubIds.add(id));
      
      // Add club IDs from clubAdminId
      clubsFromAdminId.forEach(club => {
        const clubId = club.id || club.clubId;
        if (clubId != null) {
          allClubIds.add(Number(clubId));
        }
      });

      const uniqueClubIds = Array.from(allClubIds);
      console.log('🏛️ Total unique club IDs:', uniqueClubIds);

      if (uniqueClubIds.length === 0) {
        console.warn('⚠️ No managed clubs found for user:', user.id);
        toast.info('You are not assigned as a club admin for any club yet. Please contact the system administrator to assign you as a club admin.');
        setStats((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Fetch club details for each club ID
      const clubPromises = uniqueClubIds.map(async (clubId: number) => {
        try {
          const club = await clubApi.getById(clubId);
          return club;
        } catch (err) {
          console.warn(`Failed to load club ${clubId}:`, err);
          return null;
        }
      });

      const clubs = (await Promise.all(clubPromises)).filter(Boolean);
      console.log('✅ Loaded managed clubs:', clubs.length, clubs.map(c => ({ id: c.id, title: c.title || c.name })));

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
                  pendingRequestsCount={pendingRequestsCount}
                />
              </div>
        </>
      )}
    </div>
  );
};

export default ClubAdminDashboard;

