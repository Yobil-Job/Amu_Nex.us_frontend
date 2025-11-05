import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Plus, RefreshCw, Globe } from 'lucide-react';
import { announcementApi, clubApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import AnnouncementsList from '@/components/admin/AnnouncementsList';
import AnnouncementFilters from '@/components/admin/AnnouncementFilters';
import CreateAnnouncementDialog from '@/components/admin/CreateAnnouncementDialog';
import EditAnnouncementDialog from '@/components/admin/EditAnnouncementDialog';
import DeleteAnnouncementDialog from '@/components/admin/DeleteAnnouncementDialog';
import AnnouncementSchedulingDialog from '@/components/admin/AnnouncementSchedulingDialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isToday, isThisWeek, isThisMonth, startOfDay, subDays } from 'date-fns';
import { Building2, Clock } from 'lucide-react';

const AdminAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [allAnnouncements, setAllAnnouncements] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [clubFilter, setClubFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Modals
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSchedulingDialogOpen, setIsSchedulingDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [announcementsRes, clubsRes] = await Promise.all([
        announcementApi.getAll().catch(() => ({ _embedded: { announcementResponseDtoList: [] } })),
        clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } })),
      ]);

      const announcementsList = extractCollection<any>(announcementsRes);
      const clubsList = extractCollection<any>(clubsRes);

      setAllAnnouncements(announcementsList);
      setAnnouncements(announcementsList);
      setClubs(clubsList);
    } catch (error: any) {
      console.error('Failed to load announcements:', error);
      toast.error(error.message || 'Failed to load announcements');
      setAnnouncements([]);
      setAllAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

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

    // Club filter
    if (clubFilter !== 'all') {
      if (clubFilter === 'system') {
        // System-wide announcements (no club)
        filtered = filtered.filter((announcement) => !announcement.club?.id);
      } else {
        // Specific club
        filtered = filtered.filter((announcement) => {
          const clubId = announcement.club?.id?.toString() || '';
          return clubId === clubFilter;
        });
      }
    }

    // Date filter
    if (dateFilter !== 'all') {
      filtered = filtered.filter((announcement) => {
        const dateString = announcement.createdAt || announcement.scheduledAt;
        if (!dateString) return false;

        try {
          const date = parseISO(dateString);
          const now = new Date();

          switch (dateFilter) {
            case 'today':
              return isToday(date);
            case 'week':
              return isThisWeek(date);
            case 'month':
              return isThisMonth(date);
            case 'older':
              return date < startOfDay(subDays(now, 30));
            default:
              return true;
          }
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [allAnnouncements, searchQuery, clubFilter, dateFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setClubFilter('all');
    setDateFilter('all');
  };

  const openEditDialog = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteDialogOpen(true);
  };

  const openSchedulingDialog = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setIsSchedulingDialogOpen(true);
  };

  const openDetailsDialog = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setIsDetailsDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    loadData();
  };

  const handleEditSuccess = () => {
    loadData();
  };

  const handleDeleteSuccess = () => {
    loadData();
  };

  const handleSchedule = async (scheduledAt: string) => {
    if (!selectedAnnouncement?.id) return;
    
    try {
      // Note: This would need a backend endpoint for scheduling
      // For now, we'll update the announcement with scheduledAt field
      await announcementApi.update(selectedAnnouncement.id, {
        scheduledAt: scheduledAt || undefined,
      });
      toast.success('Announcement scheduled successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule announcement');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const systemWideCount = allAnnouncements.filter((ann) => !ann.club?.id).length;
  const clubSpecificCount = allAnnouncements.filter((ann) => ann.club?.id).length;

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Bell className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Announcements Management
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage all announcements across all clubs
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-primary gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Announcement
          </Button>
          <Button
            onClick={loadData}
            variant="outline"
            className="gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="luxury-divider"></div>

      {/* Stats Summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{allAnnouncements.length}</div>
            <div className="text-sm text-muted-foreground">Total Announcements</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-accent" />
              <div className="text-2xl font-bold text-white">{systemWideCount}</div>
            </div>
            <div className="text-sm text-muted-foreground">System-Wide</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{clubSpecificCount}</div>
            <div className="text-sm text-muted-foreground">Club-Specific</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <AnnouncementFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        clubFilter={clubFilter}
        onClubFilterChange={setClubFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        clubs={clubs}
        onClearFilters={clearFilters}
      />

      {/* Announcements List */}
      <AnnouncementsList
        announcements={filteredAnnouncements}
        isLoading={isLoading}
        onViewDetails={openDetailsDialog}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
        onSchedule={openSchedulingDialog}
      />

      {/* Modals */}
      <CreateAnnouncementDialog
        clubs={clubs}
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditAnnouncementDialog
        announcement={selectedAnnouncement}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={handleEditSuccess}
      />

      <DeleteAnnouncementDialog
        announcement={selectedAnnouncement}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={handleDeleteSuccess}
      />

      <AnnouncementSchedulingDialog
        announcement={selectedAnnouncement}
        isOpen={isSchedulingDialogOpen}
        onClose={() => setIsSchedulingDialogOpen(false)}
        onSchedule={handleSchedule}
      />

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              {selectedAnnouncement?.title || 'Announcement Details'}
            </DialogTitle>
            <DialogDescription>
              Complete announcement information
            </DialogDescription>
          </DialogHeader>

          {selectedAnnouncement && (
            <div className="space-y-4">
              <div className="glass-card p-4 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-white mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedAnnouncement.description || 'No description available'}
                </p>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="glass-card p-4 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-white">Created Date</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedAnnouncement.createdAt)}
                  </p>
                </div>

                {selectedAnnouncement.scheduledAt && (
                  <div className="glass-card p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-accent" />
                      <h3 className="font-semibold text-white">Scheduled For</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedAnnouncement.scheduledAt)}
                    </p>
                    <Badge variant="outline" className="mt-2">Scheduled</Badge>
                  </div>
                )}
              </div>

              <div className="glass-card p-4 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  {selectedAnnouncement.club ? (
                    <>
                      <Building2 className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-white">Club</h3>
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 text-accent" />
                      <h3 className="font-semibold text-white">Target</h3>
                    </>
                  )}
                </div>
                {selectedAnnouncement.club ? (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedAnnouncement.club.title || selectedAnnouncement.club.name || 'Unknown Club'}
                    </p>
                    {selectedAnnouncement.club.club_Type && (
                      <Badge variant="outline" className="mt-2">
                        {selectedAnnouncement.club.club_Type}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">System-Wide (All Clubs)</p>
                    <Badge variant="default" className="mt-2">All Clubs</Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    openSchedulingDialog(selectedAnnouncement);
                  }}
                  className="flex-1"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {selectedAnnouncement.scheduledAt ? 'Reschedule' : 'Schedule'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    openEditDialog(selectedAnnouncement);
                  }}
                  className="flex-1"
                >
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAnnouncements;

