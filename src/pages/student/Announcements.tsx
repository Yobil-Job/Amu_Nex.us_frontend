import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { studentApi, announcementApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Bell, Search, Filter, Building2, Clock, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import AnnouncementCard from '@/components/student/AnnouncementCard';
import NotificationsPanel from '@/components/student/NotificationsPanel';

const STORAGE_KEY = 'student_read_announcements';

const StudentAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [allAnnouncements, setAllAnnouncements] = useState<any[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<any[]>([]);
  const [readAnnouncements, setReadAnnouncements] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterClubId, setFilterClubId] = useState<string>('all');
  const [filterReadStatus, setFilterReadStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
      loadReadAnnouncements();
    }
  }, [user?.id]);

  const loadReadAnnouncements = useCallback(() => {
    if (!user?.id) return;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        const readIds: number[] = JSON.parse(stored);
        setReadAnnouncements(readIds);
      }
    } catch (error) {
      console.error('Failed to load read announcements:', error);
    }
  }, [user?.id]);

  const saveReadAnnouncements = useCallback((readIds: number[]) => {
    if (!user?.id) return;
    try {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(readIds));
      setReadAnnouncements(readIds);
    } catch (error) {
      console.error('Failed to save read announcements:', error);
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // Load joined clubs first
      const joinedClubsRes = await studentApi.getClubs(user.id).catch((err) => {
        console.warn('Failed to load joined clubs:', err);
        return { _embedded: { responseClubDtoList: [] } };
      });

      const clubsList = extractCollection<any>(joinedClubsRes) || [];
      setJoinedClubs(clubsList);

      // Load announcements from all joined clubs
      const validClubs = clubsList.filter(club => club && club.id != null);
      const announcementPromises = validClubs.map(async (club) => {
        try {
          const response = await announcementApi.getByClub(club.id);
          // Handle different response formats
          if (Array.isArray(response)) {
            return response.filter(ann => ann && ann.id).map(ann => ({
              ...ann,
              club: club, // Ensure club info is attached
            }));
          }
          // Try HATEOAS format
          const announcementsList = extractCollection<any>(response);
          return Array.isArray(announcementsList)
            ? announcementsList.filter(ann => ann && ann.id).map(ann => ({
                ...ann,
                club: club,
              }))
            : [];
        } catch (err: any) {
          // Silently fail for individual clubs
          console.warn(`Failed to load announcements for club ${club.id}:`, err);
          return [];
        }
      });

      const announcementArrays = await Promise.all(announcementPromises);
      const allAnnouncementsList = announcementArrays.flat();

      // Deduplicate by ID
      const uniqueAnnouncements = allAnnouncementsList.filter((ann, index, self) =>
        ann && ann.id && index === self.findIndex(a => a && a.id === ann.id)
      );

      setAllAnnouncements(uniqueAnnouncements);
      setAnnouncements(uniqueAnnouncements);
    } catch (error: any) {
      console.error('Failed to load announcements:', error);
      if (error?.status !== 403) {
        toast.error('Failed to load announcements. Please try again.');
      }
      setAnnouncements([]);
      setAllAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAnnouncements = useMemo(() => {
    let filtered = allAnnouncements.filter(ann => ann && ann.id);

    // Filter by read status
    if (filterReadStatus === 'read') {
      filtered = filtered.filter(ann => readAnnouncements.includes(ann.id));
    } else if (filterReadStatus === 'unread') {
      filtered = filtered.filter(ann => !readAnnouncements.includes(ann.id));
    }

    // Filter by club
    if (filterClubId !== 'all') {
      const clubIdNum = parseInt(filterClubId);
      if (!isNaN(clubIdNum)) {
        filtered = filtered.filter(ann =>
          ann.club && ann.club.id === clubIdNum
        );
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ann => {
        const title = (ann.title || '').toLowerCase();
        const description = (ann.description || '').toLowerCase();
        const clubName = (ann.club?.title || ann.club?.name || '').toLowerCase();
        return title.includes(query) || description.includes(query) || clubName.includes(query);
      });
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      try {
        const dateA = parseISO(a.createdAt);
        const dateB = parseISO(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      } catch {
        return 0;
      }
    });
  }, [allAnnouncements, filterReadStatus, filterClubId, searchQuery, readAnnouncements]);

  const handleMarkAsRead = (announcementId: number) => {
    if (readAnnouncements.includes(announcementId)) return;
    const updated = [...readAnnouncements, announcementId];
    saveReadAnnouncements(updated);
    toast.success('Marked as read');
  };

  const handleMarkAllAsRead = () => {
    const allIds = allAnnouncements.filter(ann => ann && ann.id).map(ann => ann.id);
    const updated = [...new Set([...readAnnouncements, ...allIds])];
    saveReadAnnouncements(updated);
    toast.success('All announcements marked as read');
  };

  const openAnnouncementDetails = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setIsDetailsDialogOpen(true);
    // Auto-mark as read when viewing
    if (announcement?.id && !readAnnouncements.includes(announcement.id)) {
      handleMarkAsRead(announcement.id);
    }
  };

  const unreadAnnouncements = useMemo(() =>
    allAnnouncements.filter(ann => ann && ann.id && !readAnnouncements.includes(ann.id)).map(ann => ann.id),
    [allAnnouncements, readAnnouncements]
  );

  const unreadCount = unreadAnnouncements.length;
  const readCount = readAnnouncements.length;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight neon-text text-white">
            Announcements
          </h1>
          <p className="text-muted-foreground mt-1">
            Latest updates from your joined clubs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationsPanel
            announcements={allAnnouncements}
            unreadAnnouncements={unreadAnnouncements}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onViewAnnouncement={openAnnouncementDetails}
          />
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {allAnnouncements.length} {allAnnouncements.length === 1 ? 'Announcement' : 'Announcements'}
          </Badge>
          {unreadCount > 0 && (
            <Badge className="bg-primary/20 text-primary border-primary/30 text-lg px-4 py-2">
              {unreadCount} New
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterReadStatus} onValueChange={(v) => setFilterReadStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({allAnnouncements.length})</SelectItem>
                <SelectItem value="unread">Unread ({unreadCount})</SelectItem>
                <SelectItem value="read">Read ({readCount})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterClubId} onValueChange={setFilterClubId}>
              <SelectTrigger>
                <SelectValue placeholder="All Clubs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {joinedClubs.map((club) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.title || club.name || `Club ${club.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Announcements Display */}
      {filteredAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Announcements Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterClubId !== 'all' || filterReadStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'No announcements from your joined clubs yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredAnnouncements.map((announcement) => {
            const isRead = readAnnouncements.includes(announcement.id);
            return (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                isRead={isRead}
                onViewDetails={openAnnouncementDetails}
                onMarkAsRead={handleMarkAsRead}
              />
            );
          })}
        </div>
      )}

      {/* Announcement Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-2">
                      {selectedAnnouncement.title || 'Untitled Announcement'}
                    </DialogTitle>
                    {selectedAnnouncement.club && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Building2 className="h-4 w-4" />
                        <span>
                          {selectedAnnouncement.club.title || selectedAnnouncement.club.name || 'Unknown Club'}
                        </span>
                      </div>
                    )}
                  </div>
                  {!readAnnouncements.includes(selectedAnnouncement.id) && (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      New
                    </Badge>
                  )}
                </div>
              </DialogHeader>
              <DialogDescription className="space-y-4">
                {/* Description */}
                {selectedAnnouncement.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Details</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {selectedAnnouncement.description}
                    </p>
                  </div>
                )}

                {/* Date */}
                {selectedAnnouncement.createdAt && (
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Posted</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(selectedAnnouncement.createdAt), 'EEEE, MMMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action */}
                {!readAnnouncements.includes(selectedAnnouncement.id) && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        handleMarkAsRead(selectedAnnouncement.id);
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mark as read
                    </Button>
                  </div>
                )}
              </DialogDescription>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentAnnouncements;
