import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Plus, Search, X, RefreshCw } from 'lucide-react';
import { authorityApi, clubApi, studentApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { loadManagedClubsForUser } from '@/lib/clubAdminUtils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import AuthoritiesList from '@/components/club-admin/AuthoritiesList';
import CreateAuthorityDialog from '@/components/club-admin/CreateAuthorityDialog';
import EditAuthorityDialog from '@/components/club-admin/EditAuthorityDialog';
import DeleteAuthorityDialog from '@/components/club-admin/DeleteAuthorityDialog';
import { Badge } from '@/components/ui/badge';

const ClubAdminAuthorities = () => {
  const { user } = useAuth();
  const [managedClubs, setManagedClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAuthority, setSelectedAuthority] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadManagedClubs();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClub?.id) {
      loadAuthorities();
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

  const loadAuthorities = async () => {
    if (!selectedClub?.id) return;

    setIsLoading(true);
    try {
      // Fetch both authorities and members in parallel
      const [authoritiesRes, membersRes] = await Promise.all([
        authorityApi.getByClub(selectedClub.id).catch(() => ({ _embedded: { authorityResponseDtoList: [] } })),
        clubApi.getMembers(selectedClub.id).catch(() => ({ _embedded: { studentResponseDtoList: [] } })),
      ]);
      
      const authoritiesList = extractCollection<any>(authoritiesRes) || [];
      const membersList = extractCollection<any>(membersRes) || [];
      
      if (import.meta.env.DEV) {
        console.log('🔍 DEBUG: Authorities from getByClub:', authoritiesList.length);
        console.log('🔍 DEBUG: Members from getMembers:', membersList.length);
      }
      
      // Since authority response doesn't include student ID, we need to match by checking each member's authorities
      // Create a map of authority ID to authority data
      const authoritiesMap = new Map();
      authoritiesList.forEach((auth: any) => {
        authoritiesMap.set(Number(auth.id), auth);
      });
      
      // For each member, get their authorities and match with our club's authorities
      const enrichedAuthorities: any[] = [];
      
      for (const member of membersList) {
        if (!member.id) continue;
        
        try {
          // Get all authorities for this student
          const studentAuthoritiesRes = await authorityApi.getByStudent(Number(member.id)).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
          const studentAuthorities = extractCollection<any>(studentAuthoritiesRes) || [];
          
          // Find authorities that match our club's authorities (by ID)
          for (const studentAuth of studentAuthorities) {
            const authorityId = studentAuth.id;
            if (authoritiesMap.has(Number(authorityId))) {
              // This student has this authority - enrich it with student data
              const authority = authoritiesMap.get(Number(authorityId));
              enrichedAuthorities.push({
                ...authority,
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
              authoritiesMap.delete(Number(authorityId));
            }
          }
        } catch (error) {
          console.error(`Failed to get authorities for student ${member.id}:`, error);
        }
      }
      
      // Add any remaining authorities that weren't matched (shouldn't happen, but handle gracefully)
      authoritiesMap.forEach((authority) => {
        enrichedAuthorities.push({
          ...authority,
          student: {},
          studentId: undefined,
        });
      });
      
      if (import.meta.env.DEV) {
        console.log('📊 Enriched authorities:', {
          total: enrichedAuthorities.length,
          withStudentData: enrichedAuthorities.filter(a => a.student?.firstname).length,
        });
      }
      
      setAuthorities(enrichedAuthorities);
      
      if (import.meta.env.DEV) {
        console.log('📊 Authorities loaded:', {
          total: enrichedAuthorities.length,
          withStudentData: enrichedAuthorities.filter(a => a.student?.firstname).length,
          membersCount: membersList.length,
        });
      }
    } catch (error: any) {
      console.error('Failed to load authorities:', error);
      toast.error('Failed to load authorities');
      setAuthorities([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter authorities
  const filteredAuthorities = useMemo(() => {
    let filtered = [...authorities];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((authority) => {
        const student = authority.student || authority.studentResponseDto || {};
        const firstname = (student.firstname || '').toLowerCase();
        const lastname = (student.lastname || '').toLowerCase();
        const email = (student.email || '').toLowerCase();
        const roleName = (authority.name || authority.authority || '').toLowerCase();
        return (
          firstname.includes(query) ||
          lastname.includes(query) ||
          email.includes(query) ||
          roleName.includes(query) ||
          `${firstname} ${lastname}`.includes(query)
        );
      });
    }

    return filtered;
  }, [authorities, searchQuery]);

  const handleCreate = () => {
    setCreateDialogOpen(true);
  };

  const handleEdit = (authority: any) => {
    setSelectedAuthority(authority);
    setEditDialogOpen(true);
  };

  const handleDelete = (authority: any) => {
    setSelectedAuthority(authority);
    setDeleteDialogOpen(true);
  };

  const handleSuccess = () => {
    loadAuthorities();
  };

  const handleClose = () => {
    setSelectedAuthority(null);
  };

  // Count authorities by role
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    authorities.forEach((auth) => {
      const role = auth.name || 'Unknown';
      counts[role] = (counts[role] || 0) + 1;
    });
    return counts;
  }, [authorities]);

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Authorities' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Authorities
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedClub
                ? `Manage leadership roles for ${selectedClub.title || selectedClub.name || 'Club'}`
                : 'Select a club to manage authorities'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedClub && (
            <Button
              variant="default"
              size="sm"
              onClick={handleCreate}
              className="gap-2 purple-gold-gradient"
            >
              <Plus className="h-4 w-4" />
              Create Authority
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadAuthorities}
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
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No Club Assigned</h3>
            <p className="text-muted-foreground">
              You are not assigned as a club admin for any club yet. Please contact the system administrator.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search Bar */}
          <Card className="glass-card border-primary/20">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
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
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{authorities.length}</div>
                <div className="text-sm text-muted-foreground">Total Authorities</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{Object.keys(roleCounts).length}</div>
                <div className="text-sm text-muted-foreground">Unique Roles</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{filteredAuthorities.length}</div>
                <div className="text-sm text-muted-foreground">Filtered Results</div>
              </CardContent>
            </Card>
          </div>

          {/* Role Distribution */}
          {Object.keys(roleCounts).length > 0 && (
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(roleCounts).map(([role, count]) => (
                    <Badge key={role} variant="secondary" className="text-sm px-3 py-1">
                      {role}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Authorities List */}
          <AuthoritiesList
            authorities={filteredAuthorities}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </>
      )}

      {/* Modals */}
      <CreateAuthorityDialog
        clubId={selectedClub?.id || 0}
        clubAdminId={user?.id || 0}
        isOpen={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          handleClose();
        }}
        onSuccess={handleSuccess}
      />

      <EditAuthorityDialog
        authority={selectedAuthority}
        clubAdminId={user?.id || 0}
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          handleClose();
        }}
        onSuccess={handleSuccess}
      />

      <DeleteAuthorityDialog
        authority={selectedAuthority}
        clubId={selectedClub?.id || 0}
        clubAdminId={user?.id || 0}
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          handleClose();
        }}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default ClubAdminAuthorities;

