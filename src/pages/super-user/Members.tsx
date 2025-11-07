import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, UserPlus } from 'lucide-react';
import { clubApi, authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import MembersList from '@/components/super-user/MembersList';
import MemberFilters from '@/components/super-user/MemberFilters';
import ApproveMemberDialog from '@/components/super-user/ApproveMemberDialog';
import RejectMemberDialog from '@/components/super-user/RejectMemberDialog';
import AssignRoleDialog from '@/components/super-user/AssignRoleDialog';
import ExportMembersButton from '@/components/super-user/ExportMembersButton';
import Pagination from '@/components/admin/Pagination';
import EmptyState from '@/components/admin/EmptyState';
import { Badge } from '@/components/ui/badge';

const SuperUserMembers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
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
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadUserClub();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClub?.id) {
      loadMembers();
      loadPendingRequests();
    }
  }, [selectedClub?.id]);

  // Load user's club (SUPER_USER has authorities assigned by club admin)
  const loadUserClub = async () => {
    try {
      const authoritiesRes = await authorityApi.getByStudent(user?.id || 0).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
      const allAuthorities = extractCollection<any>(authoritiesRes) || [];

      // Filter authorities for the current user (SUPER_USER)
      const userAuthorities = allAuthorities.filter((auth: any) => {
        const studentId = auth.student?.id || auth.studentId;
        return studentId === user?.id;
      });

      if (userAuthorities.length === 0) {
        toast.info('You are not assigned as an authority for any club yet. Please contact your club admin.');
        setIsLoading(false);
        return;
      }

      // Get the first club ID (if multiple, use the first one)
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

  const loadPendingRequests = async () => {
    if (!selectedClub?.id) return;

    try {
      const clubId = selectedClub.id;
      const requestsRes = await clubApi.getPendingRequests(clubId).catch(() => ({ _embedded: { requestResponseDtoList: [] } }));
      const requestsList = extractCollection<any>(requestsRes) || [];
      setPendingRequests(requestsList);
    } catch (error: any) {
      console.error('Failed to load pending requests:', error);
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
        } else if (roleFilter === 'INTERNAL_ROLE') {
          // Filter for members with internal roles (not ADMIN)
          return memberAuthorities.some((auth: any) => {
            const authName = (auth.name || '').toUpperCase();
            return authName !== 'ADMIN';
          });
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

  const openApproveDialog = (request: any) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (request: any) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const openAssignRoleDialog = (member: any) => {
    setSelectedMember(member);
    setAssignRoleDialogOpen(true);
  };

  const handleRequestActionSuccess = () => {
    loadPendingRequests();
    loadMembers();
  };

  const handleAssignRoleSuccess = () => {
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
              {pendingRequests.length > 0 && (
                <Badge className="bg-accent text-accent-foreground">
                  {pendingRequests.length} Pending
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedClub
                ? `Manage members of ${selectedClub.title || selectedClub.name || 'Club'}`
                : 'Manage club members and requests'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ExportMembersButton members={filteredMembers} authorities={authorities} />
          {pendingRequests.length > 0 && (
            <Button
              onClick={() => {
                // Scroll to pending requests section
                document.getElementById('pending-requests')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              View Requests ({pendingRequests.length})
            </Button>
          )}
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
          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && (
            <Card id="pending-requests" className="glass-card border-accent/30 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-accent" />
                  Pending Join Requests ({pendingRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingRequests.map((request) => {
                    const student = request.student || request;
                    return (
                      <div
                        key={request.id || student.id}
                        className="glass-card p-4 rounded-lg border border-primary/20 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                            {(student.firstname?.[0] || '') + (student.lastname?.[0] || '')}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-white">
                              {student.firstname} {student.lastname}
                            </p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                            {student.department && (
                              <p className="text-xs text-muted-foreground mt-1">{student.department}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRejectDialog(request)}
                            className="text-destructive hover:text-destructive"
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openApproveDialog(request)}
                            className="bg-success hover:bg-success/90"
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

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
                  {pendingRequests.length}
                </div>
                <div className="text-sm text-muted-foreground">Pending Requests</div>
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
                    onAssignRole={openAssignRoleDialog}
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

      {/* Dialogs */}
      <ApproveMemberDialog
        request={selectedRequest}
        clubId={selectedClub?.id || 0}
        isOpen={approveDialogOpen}
        onClose={() => {
          setApproveDialogOpen(false);
          setSelectedRequest(null);
        }}
        onSuccess={handleRequestActionSuccess}
      />

      <RejectMemberDialog
        request={selectedRequest}
        clubId={selectedClub?.id || 0}
        isOpen={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false);
          setSelectedRequest(null);
        }}
        onSuccess={handleRequestActionSuccess}
      />

      <AssignRoleDialog
        member={selectedMember}
        clubId={selectedClub?.id || 0}
        authorities={authorities}
        isOpen={assignRoleDialogOpen}
        onClose={() => {
          setAssignRoleDialogOpen(false);
          setSelectedMember(null);
        }}
        onSuccess={handleAssignRoleSuccess}
      />
    </div>
  );
};

export default SuperUserMembers;

