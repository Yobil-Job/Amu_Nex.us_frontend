import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { clubApi, studentApi, authorityApi } from '@/lib/api';
import { 
  canCreateClub, 
  canDeleteClub, 
  canApproveRequests,
  canRejectRequests, 
  canViewClubMembers,
  canManageClubs,
  canAssignClubAdmin,
  isStudent
} from '@/lib/roles';
import { extractCollection } from '@/lib/hateoas';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Building2, Plus, Pencil, Trash2, Users, CheckCircle, XCircle, UserPlus, Clock, HelpCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ClubsDiscovery from './student/ClubsDiscovery';
import { isSuperAdmin } from '@/lib/roles';
import AdminClubs from './admin/Clubs';

const Clubs = () => {
  const { user } = useAuth();

  // Route SUPER_ADMIN to admin version
  if (isSuperAdmin(user?.role)) {
    return <AdminClubs />;
  }

  // Render student-specific clubs page for students
  if (isStudent(user?.role)) {
    return <ClubsDiscovery />;
  }

  // For club admins (ADMIN role), filter clubs based on their authorities
  const isClubAdmin = user?.role === 'ADMIN';
  
  const [clubs, setClubs] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [selectedClubForRequests, setSelectedClubForRequests] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRequestsDialogOpen, setIsRequestsDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [userClubs, setUserClubs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    club_Type: '',
    description: '',
    logo: '',
  });

  useEffect(() => {
    // Load both in parallel - all clubs and user clubs
    // For students, if all-clubs fails, loadUserClubs will fallback to joined clubs
    if (user?.id) {
      loadClubs();
      if (!isClubAdmin) {
        loadUserClubs();
      }
    } else {
      loadClubs();
    }
  }, [user?.id, isClubAdmin]);

  const loadClubs = async () => {
    setIsLoading(true);
    try {
      let clubsList: any[] = [];
      
      if (isClubAdmin) {
        // For club admins, only load clubs they are assigned to manage via authorities
        const authoritiesRes = await authorityApi.getAll().catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
        const allAuthorities = extractCollection<any>(authoritiesRes) || [];
        
        // Filter authorities where user is the club admin (ADMIN role)
        const userAuthorities = allAuthorities.filter((auth: any) => {
          const studentId = auth.student?.id || auth.studentId;
          const authName = (auth.name || '').toUpperCase();
          return studentId === user?.id && authName === 'ADMIN';
        });
        
        // Get unique club IDs
        const clubIds = [...new Set(userAuthorities.map((auth: any) => auth.club?.id || auth.clubId))].filter(Boolean);
        
        if (clubIds.length > 0) {
          // Fetch club details for each club ID
          const clubPromises = clubIds.map(async (clubId: number) => {
            try {
              const club = await clubApi.getById(clubId);
              return club;
            } catch {
              return null;
            }
          });
          
          clubsList = (await Promise.all(clubPromises)).filter(Boolean);
        }
      } else {
        // For SUPER_ADMIN and others, load all clubs
        const response = await clubApi.getAll();
        
        // Handle string response (if API returns JSON string)
        let parsedResponse = response;
        if (typeof response === 'string') {
          try {
            parsedResponse = JSON.parse(response);
          } catch (e) {
            // Silently fail - will be handled by extractCollection
          }
        }
        
        // Use extractCollection which handles multiple formats
        clubsList = extractCollection<any>(parsedResponse);
      }
      
      setClubs(clubsList);
    } catch (error: any) {
      // For students, if all-clubs fails, we'll use joined clubs (handled in loadUserClubs)
      if (user?.role === 'STUDENT' || user?.role === 'SUPER_USER') {
        // Don't show error toast for students, as they have joined clubs as fallback
      } else {
        // For admins, show error
        if (error.status === 403) {
          toast.error('Access denied: You do not have permission to view all clubs.');
        } else if (error.status === 401) {
          toast.error('Authentication required. Please login again.');
        } else {
          toast.error(error.message || 'Failed to load clubs');
        }
        setClubs([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserClubs = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const response = await studentApi.getClubs(user.id);
      const clubsList = extractCollection<any>(response);
      
      setUserClubs(clubsList);
      
      // For STUDENT/SUPER_USER, use joined clubs as available clubs if all-clubs failed
      // Check current clubs state - if empty, set to joined clubs
      if (user?.role === 'STUDENT' || user?.role === 'SUPER_USER') {
        // Use setTimeout to check after state updates
        setTimeout(() => {
          setClubs(currentClubs => {
            // Only update if clubs list is empty (all-clubs failed)
            if (currentClubs.length === 0 && clubsList.length > 0) {
              return clubsList;
            }
            return currentClubs;
          });
        }, 100);
      }
    } catch (error: any) {
      toast.error('Failed to load your clubs. Please try again.');
      setUserClubs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRequests = async (clubId: number) => {
    try {
      const response = await clubApi.getPendingRequests(clubId);
      const requestsList = extractCollection<any>(response);
      setPendingRequests(requestsList);
    } catch (error: any) {
      console.error('Failed to load pending requests:', error);
      toast.error('Failed to load pending requests');
      setPendingRequests([]);
    }
  };

  const loadClubMembers = async (clubId: number) => {
    try {
      const response = await clubApi.getMembers(clubId);
      const members = extractCollection<any>(response);
      setClubMembers(members);
    } catch (error: any) {
      console.error('Failed to load members:', error);
      toast.error('Failed to load club members');
      setClubMembers([]);
    }
  };

  const handleJoinClub = async (clubId: number) => {
    if (!user?.id) {
      toast.error('Please login to join clubs');
      return;
    }

    try {
      await studentApi.requestToJoinClub(user.id, clubId);
      toast.success('Request sent successfully! Waiting for approval.');
      loadUserClubs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send join request');
    }
  };

  const handleApproveRequest = async (clubId: number, studentId: number) => {
    try {
      await clubApi.approveRequest(clubId, studentId);
      toast.success('Request approved successfully');
      loadPendingRequests(clubId);
      loadClubs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (clubId: number, studentId: number) => {
    try {
      await clubApi.rejectRequest(clubId, studentId);
      toast.success('Request rejected');
      loadPendingRequests(clubId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request');
    }
  };

  const openRequestsDialog = (club: any) => {
    setSelectedClubForRequests(club.id);
    setIsRequestsDialogOpen(true);
    loadPendingRequests(club.id);
  };

  const openMembersDialog = (club: any) => {
    setSelectedClub(club);
    setIsMembersDialogOpen(true);
    loadClubMembers(club.id);
  };

  const isMemberOfClub = (clubId: number) => {
    return userClubs.some(club => club.id === clubId);
  };

  const [userAuthorities, setUserAuthorities] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadUserAuthorities();
    }
  }, [user?.id]);

  const loadUserAuthorities = async () => {
    if (!user?.id) return;
    try {
      const authorities = await authorityApi.getByStudent(user.id);
      const authoritiesList = extractCollection<any>(authorities);
      setUserAuthorities(authoritiesList);
    } catch {
      setUserAuthorities([]);
    }
  };

  const hasAuthorityInClub = (clubId: number) => {
    return userAuthorities.some(auth => auth.club?.id === clubId);
  };

  const handleCreate = async () => {
    try {
      await clubApi.create(formData);
      toast.success('Club created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadClubs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create club');
    }
  };

  const handleUpdate = async () => {
    if (!selectedClub) return;
    
    try {
      await clubApi.update(selectedClub.id, formData);
      toast.success('Club updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      loadClubs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update club');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this club?')) return;
    
    try {
      await clubApi.delete(id);
      toast.success('Club deleted successfully');
      loadClubs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete club');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      club_Type: '',
      description: '',
      logo: '',
    });
    setSelectedClub(null);
  };

  const openEditDialog = (club: any) => {
    setSelectedClub(club);
    setFormData({
      title: club.title,
      club_Type: club.club_Type,
      description: club.description,
      logo: club.logo || '',
    });
    setIsEditDialogOpen(true);
  };

  const getClubTypeColor = (type: string) => {
    const colors: any = {
      Acadamic: 'bg-primary/10 text-primary',
      Creative: 'bg-accent/10 text-accent',
      Sport: 'bg-success/10 text-success',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  // Client-side statistics (computed from loaded data)
  const clubStats = useMemo(() => {
    const totalMembers = clubs.reduce((sum, club) => sum + (club.memberCount || 0), 0);
    const clubsByType = clubs.reduce((acc, club) => {
      const type = club.club_Type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { totalMembers, clubsByType, totalClubs: clubs.length };
  }, [clubs]);

  return (
    <TooltipProvider>
      <div className="space-y-8 animate-fade-in min-h-screen pb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl purple-gold-gradient shadow-colored-primary animate-float">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight neon-text text-white">Clubs</h1>
              <p className="text-muted-foreground text-lg">Manage university clubs and memberships</p>
            </div>
          </div>
          {canCreateClub(user?.role) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => setIsCreateDialogOpen(true)} variant="accent" className="gap-2 shadow-colored-accent">
                  <Plus className="h-4 w-4" />
                  Create Club
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a new club for your university</p>
              </TooltipContent>
            </Tooltip>
        )}
      </div>

      {/* Client-side Statistics */}
      {!isLoading && clubs.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card className="glass-card stat-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clubs</p>
                  <p className="text-3xl font-bold neon-text text-white">{clubStats.totalClubs}</p>
                </div>
                <Building2 className="h-8 w-8 text-primary/50 animate-float" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card stat-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-3xl font-bold neon-text text-white">{clubStats.totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-primary/50 animate-float" style={{ animationDelay: '200ms' }} />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card stat-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Members/Club</p>
                  <p className="text-3xl font-bold neon-text text-white">
                    {clubStats.totalClubs > 0 ? Math.round(clubStats.totalMembers / clubStats.totalClubs) : 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary/50 animate-float" style={{ animationDelay: '400ms' }} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground font-medium">Loading clubs...</p>
        </div>
      ) : clubs.length === 0 ? (
        <Card className="border-accent/20">
          <CardContent className="text-center py-16">
            <div className="p-4 rounded-2xl bg-gradient-accent/10 inline-block mb-4">
              <Building2 className="h-16 w-16 text-accent" />
            </div>
            {isClubAdmin ? (
              <>
                <p className="text-muted-foreground text-lg font-semibold mb-2">No clubs assigned</p>
                <p className="text-muted-foreground text-sm">
                  You are not assigned as a club admin for any club yet. Please contact the system administrator to assign you as a club admin.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-lg">No clubs found. Create your first club!</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club, index) => (
            <Card key={club.id} className="glass-card glow-effect border-primary/20 animate-slide-up hover:scale-105 transition-all" style={{ animationDelay: `${index * 50}ms` }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1 neon-text text-white">{club.title}</CardTitle>
                    <Badge className={`${getClubTypeColor(club.club_Type)} border-primary/20`}>
                      {club.club_Type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {club.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 animate-float" style={{ animationDelay: `${index * 100}ms` }} />
                    <span className="text-white">{club.memberCount || 0} members</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {!isMemberOfClub(club.id) && user?.role !== 'SUPER_ADMIN' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleJoinClub(club.id)}
                      className="flex-1 gap-2 bg-gradient-primary shadow-colored-primary hover:shadow-lg transition-all"
                    >
                      <UserPlus className="h-4 w-4" />
                      Join Club
                    </Button>
                  )}
                  {isMemberOfClub(club.id) && (
                    <Badge variant="secondary" className="flex-1 justify-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Member
                    </Badge>
                  )}
                  {canViewClubMembers(user?.role) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMembersDialog(club)}
                          className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View club members</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {(canManageClubs(user?.role) || hasAuthorityInClub(club.id)) && (
                    <>
                      {canApproveRequests(user?.role) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRequestsDialog(club)}
                              className="hover:bg-warning/10 hover:text-warning hover:border-warning/30 transition-all"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View and manage pending join requests</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {canManageClubs(user?.role) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(club)}
                              className="hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit club information</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {canDeleteClub(user?.role) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(club.id)}
                              className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete club permanently</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Club</DialogTitle>
            <DialogDescription>Add a new club to your university</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Club Name</Label>
              <Input
                id="title"
                placeholder="Computer Science Club"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="club_Type">Club Type</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select the category that best describes your club</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={formData.club_Type} onValueChange={(value) => setFormData({ ...formData, club_Type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Acadamic">Academic</SelectItem>
                  <SelectItem value="Creative">Creative</SelectItem>
                  <SelectItem value="Sport">Sport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the club's purpose and activities..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={handleCreate} variant="accent" className="w-full mt-2">Create Club</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
            <DialogDescription>Update club information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Club Name</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-club_Type">Club Type</Label>
              <Select value={formData.club_Type} onValueChange={(value) => setFormData({ ...formData, club_Type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Acadamic">Academic</SelectItem>
                  <SelectItem value="Creative">Creative</SelectItem>
                  <SelectItem value="Sport">Sport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={handleUpdate} variant="accent" className="w-full mt-2">Update Club</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending Requests Dialog */}
      <Dialog open={isRequestsDialogOpen} onOpenChange={setIsRequestsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pending Join Requests</DialogTitle>
            <DialogDescription>Approve or reject club membership requests</DialogDescription>
          </DialogHeader>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request: any) => (
                    <TableRow key={request.studentId}>
                      <TableCell className="font-medium">
                        {request.firstname} {request.lastname}
                      </TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>
                        {request.requestDate && format(new Date(request.requestDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canApproveRequests(user?.role) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => selectedClubForRequests && handleApproveRequest(selectedClubForRequests, request.studentId)}
                              className="hover:bg-success/10 hover:text-success hover:border-success/30"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          {canRejectRequests(user?.role) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => selectedClubForRequests && handleRejectRequest(selectedClubForRequests, request.studentId)}
                              className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Club Members</DialogTitle>
            <DialogDescription>
              {selectedClub ? `Members of ${selectedClub.title}` : 'Club members'}
            </DialogDescription>
          </DialogHeader>
          {clubMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No members found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clubMembers.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.firstname} {member.lastname}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.department || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{member.role || 'STUDENT'}</Badge>
                          {canAssignClubAdmin(user?.role) && member.role !== 'SUPER_USER' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                if (!confirm(`Assign ${member.firstname} ${member.lastname} as club admin?`)) return;
                                try {
                                  await clubApi.assignClubAdmin(selectedClub.id, member.id);
                                  toast.success('Club admin assigned successfully');
                                  loadClubMembers(selectedClub.id);
                                } catch (error: any) {
                                  toast.error(error.message || 'Failed to assign club admin');
                                }
                              }}
                              className="text-xs"
                              title="Assign as Club Admin"
                            >
                              Assign Admin
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

export default Clubs;
