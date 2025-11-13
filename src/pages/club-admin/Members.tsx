import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2 } from 'lucide-react';
import { clubApi, authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { loadManagedClubsForUser } from '@/lib/clubAdminUtils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import MemberFilters from '@/components/club-admin/MemberFilters';
import MembersList from '@/components/club-admin/MembersList';
import MemberDetailsModal from '@/components/club-admin/MemberDetailsModal';
import RemoveMemberDialog from '@/components/club-admin/RemoveMemberDialog';
import Pagination from '@/components/admin/Pagination';
import EmptyState from '@/components/admin/EmptyState';

const ClubAdminMembers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [managedClubs, setManagedClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadManagedClubs();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClub?.id) {
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

  const loadMembers = async () => {
    if (!selectedClub?.id) return;

    setIsLoading(true);
    try {
      const clubId = selectedClub.id;

      const [membersRes, authoritiesRes] = await Promise.all([
        clubApi.getMembers(clubId).catch(() => ({ _embedded: { studentResponseDtoList: [] } })),
        authorityApi.getByClub(clubId).catch(() => ({ _embedded: { authorityResponseDtoList: [] } })),
      ]);

      const membersList = extractCollection<any>(membersRes) || [];
      const authoritiesList = extractCollection<any>(authoritiesRes) || [];

      setAllMembers(membersList);
      setMembers(membersList);
      setAuthorities(authoritiesList);
    } catch (error: any) {
      console.error('Failed to load members:', error);
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique departments
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    allMembers.forEach((member) => {
      if (member.department) {
        deptSet.add(member.department);
      }
    });
    return Array.from(deptSet).sort();
  }, [allMembers]);

  // Filter members
  const filteredMembers = useMemo(() => {
    let filtered = [...allMembers];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((member) => {
        const firstname = (member.firstname || '').toLowerCase();
        const lastname = (member.lastname || '').toLowerCase();
        const email = (member.email || '').toLowerCase();
        const department = (member.department || '').toLowerCase();
        return (
          firstname.includes(query) ||
          lastname.includes(query) ||
          email.includes(query) ||
          department.includes(query) ||
          `${firstname} ${lastname}`.includes(query)
        );
      });
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter((member) => member.department === departmentFilter);
    }

    // Year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter((member) => member.yearOfStay === yearFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((member) => {
        const memberAuthorities = authorities.filter((auth: any) => {
          const studentId = auth.student?.id || auth.studentId;
          return studentId === member.id;
        });
        
        if (roleFilter === 'AUTHORITY') {
          return memberAuthorities.length > 0;
        } else if (roleFilter === 'STUDENT') {
          return memberAuthorities.length === 0;
        }
        return true;
      });
    }

    return filtered;
  }, [allMembers, authorities, searchQuery, departmentFilter, yearFilter, roleFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, yearFilter, roleFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('all');
    setYearFilter('all');
    setRoleFilter('all');
  };

  const openDetailsModal = (member: any) => {
    setSelectedMember(member);
    setDetailsModalOpen(true);
  };

  const openRemoveDialog = (member: any) => {
    setSelectedMember(member);
    setRemoveDialogOpen(true);
  };

  const handleRemoveSuccess = () => {
    loadMembers();
  };

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Members' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Users className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Club Members
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedClub
                ? `Manage members of ${selectedClub.title || selectedClub.name || 'Club'}`
                : 'Select a club to manage members'}
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
          {/* Filters */}
          <MemberFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            roleFilter={roleFilter}
            onRoleChange={setRoleFilter}
            departmentFilter={departmentFilter}
            onDepartmentChange={setDepartmentFilter}
            yearFilter={yearFilter}
            onYearChange={setYearFilter}
            departments={departments}
            onClearFilters={clearFilters}
          />

          {/* Stats Summary */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{allMembers.length}</div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{filteredMembers.length}</div>
                <div className="text-sm text-muted-foreground">Filtered Results</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">
                  {authorities.length}
                </div>
                <div className="text-sm text-muted-foreground">Authorities</div>
              </CardContent>
            </Card>
          </div>

          {/* Members Table */}
          <Card className="glass-card border-primary/20">
            <CardHeader className="border-b border-primary/20">
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Members List
                {filteredMembers.length !== allMembers.length && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredMembers.length} of {allMembers.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredMembers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No members found"
                  description={
                    searchQuery || departmentFilter !== 'all' || yearFilter !== 'all' || roleFilter !== 'all'
                      ? "Try adjusting your filters to see more results"
                      : "No members have joined this club yet"
                  }
                  actionLabel={
                    searchQuery || departmentFilter !== 'all' || yearFilter !== 'all' || roleFilter !== 'all'
                      ? "Clear Filters"
                      : undefined
                  }
                  onAction={
                    searchQuery || departmentFilter !== 'all' || yearFilter !== 'all' || roleFilter !== 'all'
                      ? clearFilters
                      : undefined
                  }
                />
              ) : (
                <>
                  <MembersList
                    members={filteredMembers}
                    authorities={authorities}
                    isLoading={isLoading}
                    onViewDetails={openDetailsModal}
                    onRemoveMember={openRemoveDialog}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                  />

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-primary/20">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredMembers.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                        itemsPerPageOptions={[10, 20, 50, 100]}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Modals */}
      <MemberDetailsModal
        member={selectedMember}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        authorities={authorities}
      />

      <RemoveMemberDialog
        member={selectedMember}
        clubId={selectedClub?.id || 0}
        isOpen={removeDialogOpen}
        onClose={() => setRemoveDialogOpen(false)}
        onSuccess={handleRemoveSuccess}
      />
    </div>
  );
};

export default ClubAdminMembers;

