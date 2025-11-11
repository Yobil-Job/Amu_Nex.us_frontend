import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Plus, Search, X } from 'lucide-react';
import { clubApi, eventApi, announcementApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import ClubsList from '@/components/admin/ClubsList';
import ClubDetailsModal from '@/components/admin/ClubDetailsModal';
import CreateClubDialog from '@/components/admin/CreateClubDialog';
import EditClubDialog from '@/components/admin/EditClubDialog';
import DeleteClubDialog from '@/components/admin/DeleteClubDialog';
import AssignClubAdminDialog from '@/components/admin/AssignClubAdminDialog';
import ClubMembersList from '@/components/admin/ClubMembersList';
import ClubRankingCard from '@/components/admin/ClubRankingCard';
import ClubActivityDashboard from '@/components/admin/ClubActivityDashboard';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const AdminClubs = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<any[]>([]);
  const [allClubs, setAllClubs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Modals/Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignAdminDialogOpen, setIsAssignAdminDialogOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isRequestsDialogOpen, setIsRequestsDialogOpen] = useState(false);
  
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [clubPendingRequests, setClubPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const clubsRes = await clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } }));
      const clubsList = extractCollection<any>(clubsRes);

      // Try to load all events first
      let eventsList: any[] = [];
      try {
        const eventsRes = await eventApi.getAll().catch(() => ({ _embedded: { eventList: [] } }));
        eventsList = extractCollection<any>(eventsRes);
      } catch (error) {
        console.warn('Failed to load all events, will fetch per club:', error);
      }

      // If events don't have club relationship, fetch events per club
      if (eventsList.length > 0) {
        const sampleEvent = eventsList[0];
        const hasClubRelationship = sampleEvent.club || sampleEvent.clubId || sampleEvent.club_id || 
                                    sampleEvent.club?.id || sampleEvent.club?.clubId;
        
        if (!hasClubRelationship) {
          console.log('⚠️ Events don\'t have club relationship, fetching events per club...');
          // Fetch events for each club
          const clubEventsPromises = clubsList.map(async (club: any) => {
            try {
              const clubEventsRes = await eventApi.getByClub(club.id);
              const clubEvents = extractCollection<any>(clubEventsRes);
              // Add club ID to each event for easier matching
              return clubEvents.map((event: any) => ({
                ...event,
                clubId: club.id,
                club: { id: club.id }
              }));
            } catch (error) {
              console.warn(`Failed to load events for club ${club.id}:`, error);
              return [];
            }
          });
          
          const allClubEvents = await Promise.all(clubEventsPromises);
          eventsList = allClubEvents.flat();
        }
      } else {
        // No events from getAll, try fetching per club
        console.log('⚠️ No events from getAll, fetching events per club...');
        const clubEventsPromises = clubsList.map(async (club: any) => {
          try {
            const clubEventsRes = await eventApi.getByClub(club.id);
            const clubEvents = extractCollection<any>(clubEventsRes);
            // Add club ID to each event for easier matching
            return clubEvents.map((event: any) => ({
              ...event,
              clubId: club.id,
              club: { id: club.id }
            }));
          } catch (error) {
            console.warn(`Failed to load events for club ${club.id}:`, error);
            return [];
          }
        });
        
        const allClubEvents = await Promise.all(clubEventsPromises);
        eventsList = allClubEvents.flat();
      }

      // Debug: Log structure to understand data format
      if (import.meta.env.DEV) {
        console.log('📊 Total events loaded:', eventsList.length);
        console.log('📊 Total clubs loaded:', clubsList.length);
        if (eventsList.length > 0) {
          console.log('📊 Events structure sample:', eventsList[0]);
          console.log('📊 Event keys:', Object.keys(eventsList[0]));
          // Check if any events have club relationship
          const eventsWithClub = eventsList.filter(e => e.club || e.clubId || e.club_id);
          console.log('📊 Events with club relationship:', eventsWithClub.length);
          if (eventsWithClub.length > 0) {
            console.log('📊 Sample event with club:', eventsWithClub[0]);
          }
        }
        if (clubsList.length > 0) {
          console.log('📊 Clubs structure sample:', clubsList[0]);
          console.log('📊 Club keys:', Object.keys(clubsList[0]));
        }
      }

      setAllClubs(clubsList);
      setClubs(clubsList);
      setEvents(eventsList);
    } catch (error: any) {
      console.error('Failed to load clubs:', error);
      toast.error(error.message || 'Failed to load clubs');
      setClubs([]);
      setAllClubs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter clubs
  const filteredClubs = useMemo(() => {
    if (!searchQuery.trim()) {
      return allClubs;
    }

    const query = searchQuery.toLowerCase();
    return allClubs.filter((club) => {
      const title = (club.title || club.name || '').toLowerCase();
      const type = (club.club_Type || '').toLowerCase();
      const description = (club.description || '').toLowerCase();
      return title.includes(query) || type.includes(query) || description.includes(query);
    });
  }, [allClubs, searchQuery]);

  // Handlers
  const handleCreateSuccess = () => {
    loadData();
  };

  const handleEditSuccess = () => {
    loadData();
  };

  const handleDeleteSuccess = () => {
    loadData();
  };

  const handleAssignAdminSuccess = () => {
    loadData();
    if (selectedClub) {
      loadClubMembers(selectedClub.id);
    }
  };

  const openDetailsModal = (club: any) => {
    setSelectedClub(club);
    setIsDetailsModalOpen(true);
  };

  const openEditDialog = (club: any) => {
    setSelectedClub(club);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (club: any) => {
    setSelectedClub(club);
    setIsDeleteDialogOpen(true);
  };

  const openAssignAdminDialog = async (club: any) => {
    setSelectedClub(club);
    await loadClubMembers(club.id);
    setIsAssignAdminDialogOpen(true);
  };

  const openMembersDialog = async (club: any) => {
    setSelectedClub(club);
    await loadClubMembers(club.id);
    setIsMembersDialogOpen(true);
  };

  const openRequestsDialog = async (club: any) => {
    setSelectedClub(club);
    await loadClubPendingRequests(club.id);
    setIsRequestsDialogOpen(true);
  };

  const loadClubMembers = async (clubId: number) => {
    try {
      const response = await clubApi.getMembers(clubId);
      const membersList = Array.isArray(response) ? response : extractCollection<any>(response) || [];
      setClubMembers(membersList);
    } catch (error) {
      console.error('Failed to load club members:', error);
      setClubMembers([]);
    }
  };

  const loadClubPendingRequests = async (clubId: number) => {
    try {
      const response = await clubApi.getPendingRequests(clubId);
      const requestsList = extractCollection<any>(response) || [];
      // Debug: Log request structure to understand the data format
      if (import.meta.env.DEV && requestsList.length > 0) {
        console.log('📋 Pending requests structure:', requestsList[0]);
      }
      setClubPendingRequests(requestsList);
    } catch (error) {
      console.error('Failed to load pending requests:', error);
      setClubPendingRequests([]);
    }
  };

  const handleApproveRequest = async (clubId: number, studentId: number) => {
    try {
      await clubApi.approveRequest(clubId, studentId);
      toast.success('Request approved successfully');
      await loadClubPendingRequests(clubId);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (clubId: number, studentId: number) => {
    try {
      await clubApi.rejectRequest(clubId, studentId);
      toast.success('Request rejected successfully');
      await loadClubPendingRequests(clubId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Clubs' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Club Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage all clubs, members, and administrative tasks
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-primary gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Club
        </Button>
      </div>

      <div className="luxury-divider"></div>

      {/* Stats Summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{allClubs.length}</div>
            <div className="text-sm text-muted-foreground">Total Clubs</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{filteredClubs.length}</div>
            <div className="text-sm text-muted-foreground">Filtered Results</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{events.length}</div>
            <div className="text-sm text-muted-foreground">Total Events</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              {allClubs.reduce((sum, club) => {
                const clubEvents = events.filter((e) => {
                  const eventClubId = e.club?.id || e.clubId || e.club_id;
                  const clubId = club.id;
                  return eventClubId != null && clubId != null && 
                         (String(eventClubId) === String(clubId) || 
                          Number(eventClubId) === Number(clubId));
                });
                return sum + clubEvents.length;
              }, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Club Events</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <ClubRankingCard clubs={allClubs} events={events} isLoading={isLoading} />
        <ClubActivityDashboard clubs={allClubs} events={events} isLoading={isLoading} />
      </div>

      {/* Search Bar */}
      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clubs by name, type, or description..."
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

      {/* Clubs List */}
      <ClubsList
        clubs={filteredClubs}
        events={events}
        isLoading={isLoading}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onViewDetails={openDetailsModal}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
        onViewMembers={openMembersDialog}
        onViewRequests={openRequestsDialog}
        onAssignAdmin={openAssignAdminDialog}
      />

      {/* Modals and Dialogs */}
      <CreateClubDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditClubDialog
        club={selectedClub}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={handleEditSuccess}
      />

      <DeleteClubDialog
        club={selectedClub}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={handleDeleteSuccess}
      />

      <ClubDetailsModal
        club={selectedClub}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        isLoading={false}
      />

      <AssignClubAdminDialog
        club={selectedClub}
        members={clubMembers}
        isOpen={isAssignAdminDialogOpen}
        onClose={() => setIsAssignAdminDialogOpen(false)}
        onSuccess={handleAssignAdminSuccess}
      />

      {/* Members Dialog */}
      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {selectedClub?.title || selectedClub?.name || 'Club'} Members
            </DialogTitle>
            <DialogDescription>
              View all members of this club
            </DialogDescription>
          </DialogHeader>
          <ClubMembersList
            members={clubMembers}
            isLoading={false}
            clubId={selectedClub?.id || 0}
            onDemoteSuccess={async () => {
              if (selectedClub?.id) {
                await loadClubMembers(selectedClub.id);
                loadData();
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Pending Requests Dialog */}
      <Dialog open={isRequestsDialogOpen} onOpenChange={setIsRequestsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Pending Join Requests
            </DialogTitle>
            <DialogDescription>
              {selectedClub?.title || selectedClub?.name || 'Club'} - Manage join requests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {clubPendingRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clubPendingRequests.map((request) => {
                      const student = request.student || request;
                      // Extract student ID from various possible locations
                      const studentId = student?.id || request?.studentId || request?.student?.id || request?.id;
                      
                      if (!studentId) {
                        console.warn('Student ID not found in request:', request);
                      }
                      
                      return (
                        <TableRow key={request.id || studentId || Math.random()}>
                          <TableCell className="font-medium">
                            {student?.firstname || ''} {student?.lastname || ''}
                          </TableCell>
                          <TableCell>{student?.email || 'N/A'}</TableCell>
                          <TableCell>
                            {student?.department ? (
                              <Badge variant="outline">{student.department}</Badge>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-warning/10 text-warning border-warning/30">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (studentId) {
                                    handleApproveRequest(selectedClub.id, Number(studentId));
                                  } else {
                                    toast.error('Student ID not found in request');
                                  }
                                }}
                                className="text-success hover:text-success"
                                disabled={!studentId}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (studentId) {
                                    handleRejectRequest(selectedClub.id, Number(studentId));
                                  } else {
                                    toast.error('Student ID not found in request');
                                  }
                                }}
                                className="text-destructive hover:text-destructive"
                                disabled={!studentId}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClubs;

