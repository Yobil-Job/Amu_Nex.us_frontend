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
import { addActivity } from '@/components/student/ActivityTimeline';

const STORAGE_KEY = 'student_read_announcements';

// Helper function to extract club ID from multiple possible fields
const getClubId = (club: any): number | null => {
  if (!club) return null;
  const clubId = club.id || club.clubId || club.club_id;
  if (clubId == null) return null;
  const numId = typeof clubId === 'string' ? parseInt(clubId, 10) : Number(clubId);
  return isNaN(numId) ? null : numId;
};

// Helper function to extract announcement club ID
const getAnnouncementClubId = (ann: any): number | null => {
  if (!ann) return null;
  const clubId = ann.club?.id || ann.clubId || ann.club_id || ann.club?.clubId || ann.club?.club_id;
  if (clubId == null) return null;
  const numId = typeof clubId === 'string' ? parseInt(clubId, 10) : Number(clubId);
  return isNaN(numId) ? null : numId;
};

// Helper function to extract date from multiple possible fields
const getAnnouncementDate = (ann: any): Date | null => {
  const dateStr = ann.createdAt || ann.created_at || ann.scheduledAt || ann.scheduled_at || ann.date || ann.postedAt;
  if (!dateStr) return null;
  try {
    // Try parseISO first (for ISO strings)
    if (typeof dateStr === 'string') {
      const parsed = parseISO(dateStr);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    // Fallback to Date constructor
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

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
        return { _embedded: { responseClubDtoList: [] } };
      });

      const clubsList = extractCollection<any>(joinedClubsRes) || [];
      setJoinedClubs(clubsList);

      // Load announcements from all joined clubs
      const validClubs = clubsList.filter(club => {
        const clubId = getClubId(club);
        return clubId != null;
      });

      const announcementPromises = validClubs.map(async (club) => {
        try {
          const clubId = getClubId(club);
          if (!clubId) return [];

          const response = await announcementApi.getByClub(clubId);
          
          // Handle different response formats
          let announcementsList: any[] = [];
          if (Array.isArray(response)) {
            announcementsList = response;
          } else {
            // Try HATEOAS format
            announcementsList = extractCollection<any>(response) || [];
          }

          // Enrich announcements with club data
          return announcementsList
            .filter(ann => ann && ann.id)
            .map(ann => {
              // Ensure club info is properly attached
              const enrichedClub = {
                id: clubId,
                title: club.title || club.name,
                name: club.name || club.title,
                ...club,
              };
              
              return {
                ...ann,
                club: enrichedClub,
                clubId: clubId, // Also add top-level clubId for easier filtering
              };
            });
        } catch (err: any) {
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

    // Filter by club - use robust club ID matching
    if (filterClubId !== 'all') {
      const clubIdNum = parseInt(filterClubId);
      if (!isNaN(clubIdNum)) {
        filtered = filtered.filter(ann => {
          const annClubId = getAnnouncementClubId(ann);
          // Try both exact match and type-coerced match
          return annClubId != null && (
            annClubId === clubIdNum ||
            Number(annClubId) === Number(clubIdNum) ||
            String(annClubId) === String(clubIdNum)
          );
        });
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

    // Sort by date (newest first) - use robust date extraction
    return filtered.sort((a, b) => {
      const dateA = getAnnouncementDate(a);
      const dateB = getAnnouncementDate(b);
      
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return dateB.getTime() - dateA.getTime();
    });
  }, [allAnnouncements, filterReadStatus, filterClubId, searchQuery, readAnnouncements]);

  const handleMarkAsRead = (announcementId: number) => {
    if (readAnnouncements.includes(announcementId)) return;
    const updated = [...readAnnouncements, announcementId];
    saveReadAnnouncements(updated);
    
    // Track activity
    const announcement = allAnnouncements.find(a => a.id === announcementId);
    if (announcement) {
      addActivity(
        'announcement_read',
        `Read announcement: ${announcement.title || 'Untitled'}`,
        announcement.club ? `From ${announcement.club.title || announcement.club.name}` : 'Announcement read'
      );
    }
    
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
                {joinedClubs.map((club) => {
                  const clubId = getClubId(club);
                  if (!clubId) return null;
                  return (
                    <SelectItem key={clubId} value={clubId.toString()}>
                      {club.title || club.name || `Club ${clubId}`}
                    </SelectItem>
                  );
                })}
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
                {(() => {
                  const announcementDate = getAnnouncementDate(selectedAnnouncement);
                  if (!announcementDate) return null;
                  return (
                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">Posted</p>
                        <p className="text-sm text-muted-foreground">
                          {format(announcementDate, 'EEEE, MMMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  );
                })()}

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
