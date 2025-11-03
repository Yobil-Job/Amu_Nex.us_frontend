import { useEffect, useState, useCallback } from 'react';
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
  canAssignClubAdmin
} from '@/lib/roles';
import { extractCollection } from '@/lib/hateoas';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Building2, Plus, Pencil, Trash2, Users, CheckCircle, XCircle, UserPlus, Clock } from 'lucide-react';
import { format } from 'date-fns';

const Clubs = () => {
  const { user } = useAuth();
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
    loadClubs();
    if (user?.id) {
      loadUserClubs();
    }
  }, [user?.id]);

  const loadClubs = async () => {
    setIsLoading(true);
    try {
      const response = await clubApi.getAll();
      console.log('📊 Clubs API Response (full):', JSON.stringify(response, null, 2)); // Debug log
      
      // Use extractCollection which handles multiple formats
      const clubsList = extractCollection<any>(response);
      
      console.log('✅ Extracted clubs:', clubsList.length, clubsList); // Debug log
      
      if (clubsList.length === 0 && response) {
        console.warn('⚠️ No clubs extracted. Response structure:', {
          hasEmbedded: !!response._embedded,
          embeddedKeys: response._embedded ? Object.keys(response._embedded) : [],
          isArray: Array.isArray(response),
          responseKeys: Object.keys(response),
        });
      }
      
      setClubs(clubsList);
    } catch (error: any) {
      console.error('❌ Error loading clubs:', error); // Debug log
      toast.error(error.message || 'Failed to load clubs');
      setClubs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserClubs = async () => {
    if (!user?.id) return;
    try {
      const response = await studentApi.getClubs(user.id);
      const clubsList = extractCollection<any>(response);
      setUserClubs(clubsList);
    } catch (error: any) {
      console.error('Failed to load user clubs:', error);
      setUserClubs([]);
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-accent shadow-colored-accent">
            <Building2 className="h-7 w-7 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-accent bg-clip-text text-transparent">Clubs</h1>
            <p className="text-muted-foreground text-lg">Manage university clubs and memberships</p>
          </div>
        </div>
        {canCreateClub(user?.role) && (
          <Button onClick={() => setIsCreateDialogOpen(true)} variant="accent" className="gap-2 shadow-colored-accent">
            <Plus className="h-4 w-4" />
            Create Club
          </Button>
        )}
      </div>

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
            <p className="text-muted-foreground text-lg">No clubs found. Create your first club!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club, index) => (
            <Card key={club.id} className="card-hover border-accent/10 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{club.title}</CardTitle>
                    <Badge className={getClubTypeColor(club.club_Type)}>
                      {club.club_Type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {club.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{club.memberCount || 0} members</span>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openMembersDialog(club)}
                      className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                      title="View Members"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  )}
                  {(canManageClubs(user?.role) || hasAuthorityInClub(club.id)) && (
                    <>
                      {canApproveRequests(user?.role) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRequestsDialog(club)}
                          className="hover:bg-warning/10 hover:text-warning hover:border-warning/30 transition-all"
                          title="Pending Requests"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}
                      {canManageClubs(user?.role) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(club)}
                          className="hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all"
                          title="Edit Club"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteClub(user?.role) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(club.id)}
                          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                          title="Delete Club"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
              <Label htmlFor="club_Type">Club Type</Label>
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
  );
};

export default Clubs;
