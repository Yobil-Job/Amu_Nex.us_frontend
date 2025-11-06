import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Plus, RefreshCw } from 'lucide-react';
import { announcementApi, clubApi, authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import AnnouncementsList from '@/components/club-admin/AnnouncementsList';
import CreateAnnouncementDialog from '@/components/club-admin/CreateAnnouncementDialog';
import EditAnnouncementDialog from '@/components/club-admin/EditAnnouncementDialog';
import DeleteAnnouncementDialog from '@/components/club-admin/DeleteAnnouncementDialog';
import AnnouncementFilters from '@/components/club-admin/AnnouncementFilters';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isToday, isThisWeek, isThisMonth, startOfDay, subDays } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, User, Building2 } from 'lucide-react';

const ClubAdminAnnouncements = () => {
  const { user } = useAuth();
  const [managedClubs, setManagedClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [allAnnouncements, setAllAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [creatorFilter, setCreatorFilter] = useState('all');

  // Modals
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadManagedClubs();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClub?.id) {
      loadAnnouncements();
    }
  }, [selectedClub?.id]);

  // Load clubs where user is assigned as club admin (ADMIN role)
  const loadManagedClubs = async () => {
    try {
      // Get all authorities for the current user
      const authoritiesRes = await authorityApi.getByStudent(user?.id || 0).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
      const allAuthorities = extractCollection<any>(authoritiesRes) || [];

      // Filter authorities where user is the club admin (ADMIN role)
      const userAuthorities = allAuthorities.filter((auth: any) => {
        const studentId = auth.student?.id || auth.studentId;
        const authName = (auth.name || '').toUpperCase();
        return studentId === user?.id && authName === 'ADMIN';
      });

      const clubIds = [...new Set(userAuthorities.map((auth: any) => auth.club?.id || auth.clubId))].filter(Boolean);

      if (clubIds.length === 0) {
        toast.info('You are not assigned as a club admin for any club yet. Please contact the system administrator.');
        setIsLoading(false);
        return;
      }

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

      if (clubs.length === 1) {
        setSelectedClub(clubs[0]);
      } else if (clubs.length > 1) {
        setSelectedClub(clubs[0]);
      }
    } catch (error: any) {
      toast.error('Failed to load your clubs');
      setIsLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    if (!selectedClub?.id) return;

    setIsLoading(true);
    try {
      const announcementsRes = await announcementApi.getByClub(selectedClub.id).catch(() => ({ _embedded: { announcementResponseDtoList: [] } }));
      const announcementsList = extractCollection<any>(announcementsRes) || [];
      setAllAnnouncements(announcementsList);
      setAnnouncements(announcementsList);
    } catch (error: any) {
      toast.error('Failed to load announcements');
      setAnnouncements([]);
      setAllAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique creators from announcements
  const creators = useMemo(() => {
    const creatorMap = new Map();
    allAnnouncements.forEach((announcement) => {
      const creator = announcement.createdBy || announcement.creator || {};
      const creatorId = creator.id || announcement.createdById;
      if (creatorId && !creatorMap.has(creatorId)) {
        creatorMap.set(creatorId, {
          id: creatorId,
          firstname: creator.firstname || 'Unknown',
          lastname: creator.lastname || 'User',
        });
      }
    });
    return Array.from(creatorMap.values());
  }, [allAnnouncements]);

  // Filter announcements
  const filteredAnnouncements = useMemo(() => {
    let filtered = [...allAnnouncements];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((announcement) => {
        const title = (announcement.title || '').toLowerCase();
        const description = (announcement.description || '').toLowerCase();
        return title.includes(query) || description.includes(query);
      });
    }

    // Creator filter
    if (creatorFilter !== 'all') {
      filtered = filtered.filter((announcement) => {
        const creator = announcement.createdBy || announcement.creator || {};
        const creatorId = creator.id || announcement.createdById;
        return creatorId?.toString() === creatorFilter;
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = startOfDay(new Date());
      filtered = filtered.filter((announcement) => {
        if (!announcement.createdAt) return false;
        try {
          const announcementDate = startOfDay(parseISO(announcement.createdAt));
          if (dateFilter === 'today') {
            return isToday(announcementDate);
          } else if (dateFilter === 'week') {
            return isThisWeek(announcementDate);
          } else if (dateFilter === 'month') {
            return isThisMonth(announcementDate);
          } else if (dateFilter === 'older') {
            return announcementDate < subDays(now, 30);
          }
          return true;
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [allAnnouncements, searchQuery, creatorFilter, dateFilter]);

  // Announcement statistics
  const announcementStats = useMemo(() => {
    const pinned = filteredAnnouncements.filter((a) => a.pinned).length;
    return {
      total: filteredAnnouncements.length,
      pinned,
      regular: filteredAnnouncements.length - pinned,
    };
  }, [filteredAnnouncements]);

  const handleCreate = () => {
    setCreateDialogOpen(true);
  };

  const handleEdit = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setEditDialogOpen(true);
  };

  const handleDelete = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setDetailsDialogOpen(true);
  };

  const handleSuccess = () => {
    loadAnnouncements();
  };

  const handleClose = () => {
    setSelectedAnnouncement(null);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setCreatorFilter('all');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      try {
        const date = new Date(dateString);
        return format(date, 'MMM dd, yyyy HH:mm');
      } catch {
        return dateString;
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Announcements' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Bell className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Announcements
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedClub
                ? `Manage announcements for ${selectedClub.title || selectedClub.name || 'Club'}`
                : 'Select a club to manage announcements'}
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
              Create Announcement
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnnouncements}
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
            <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No Club Assigned</h3>
            <p className="text-muted-foreground">
              You are not assigned as a club admin for any club yet. Please contact the system administrator.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <AnnouncementFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            creatorFilter={creatorFilter}
            onCreatorFilterChange={setCreatorFilter}
            creators={creators}
            onClearFilters={handleClearFilters}
          />

          {/* Stats Summary */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{announcementStats.total}</div>
                <div className="text-sm text-muted-foreground">Total Announcements</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{announcementStats.pinned}</div>
                <div className="text-sm text-muted-foreground">Pinned</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-white">{announcementStats.regular}</div>
                <div className="text-sm text-muted-foreground">Regular</div>
              </CardContent>
            </Card>
          </div>

          {/* Announcements List */}
          <AnnouncementsList
            announcements={filteredAnnouncements}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentUserId={user?.id}
          />
        </>
      )}

      {/* Modals */}
      <CreateAnnouncementDialog
        clubId={selectedClub?.id || 0}
        isOpen={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          handleClose();
        }}
        onSuccess={handleSuccess}
      />

      <EditAnnouncementDialog
        announcement={selectedAnnouncement}
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          handleClose();
        }}
        onSuccess={handleSuccess}
      />

      <DeleteAnnouncementDialog
        announcement={selectedAnnouncement}
        createdById={user?.id || 0}
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          handleClose();
        }}
        onSuccess={handleSuccess}
      />

      {/* Announcement Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="glass-card border-primary/20 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl neon-text text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Announcement Details
            </DialogTitle>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{selectedAnnouncement.title}</h3>
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {selectedAnnouncement.description || 'No description'}
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-primary/20">
                <div className="flex items-center gap-2 text-white">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Created: {formatDate(selectedAnnouncement.createdAt)}</span>
                </div>
                {(selectedAnnouncement.createdBy || selectedAnnouncement.creator) && (
                  <div className="flex items-center gap-2 text-white">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      By: {(selectedAnnouncement.createdBy || selectedAnnouncement.creator).firstname}{' '}
                      {(selectedAnnouncement.createdBy || selectedAnnouncement.creator).lastname}
                    </span>
                  </div>
                )}
                {selectedClub && (
                  <div className="flex items-center gap-2 text-white">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Club: {selectedClub.title || selectedClub.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubAdminAnnouncements;

