import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Plus, RefreshCw, Search, X, MessageSquare, Lightbulb, Calendar, Building2 } from 'lucide-react';
import { announcementApi, clubApi, authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import CreateAnnouncementDialog from '@/components/super-user/CreateAnnouncementDialog';
import DiscussionBoard from '@/components/super-user/DiscussionBoard';
import SuggestionBox from '@/components/super-user/SuggestionBox';
import MeetingScheduler from '@/components/super-user/MeetingScheduler';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import EmptyState from '@/components/admin/EmptyState';

const SuperUserAnnouncements = () => {
  const { user } = useAuth();
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [allAnnouncements, setAllAnnouncements] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'announcements' | 'discussion' | 'suggestions' | 'meetings'>('announcements');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserClub();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClub?.id) {
      loadData();
    }
  }, [selectedClub?.id]);

  // Load user's authorized clubs (using shared utility - same approach as club admin)
  const loadUserClub = async () => {
    if (!user?.id) return;
    
    try {
      const { loadAuthorizedClubsForUser } = await import('@/lib/superUserUtils');
      const clubs = await loadAuthorizedClubsForUser(user.id);

      if (clubs.length === 0) {
        toast.info('You are not assigned as an authority for any club yet. Please contact your club admin.');
        setIsLoading(false);
        return;
      }

      // Use the first club (if multiple, can add selector later)
      setSelectedClub(clubs[0]);
    } catch (error: any) {
      console.error('Failed to load authorized clubs:', error);
      toast.error('Failed to load your club information');
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    if (!selectedClub?.id) return;

    setIsLoading(true);
    try {
      // Load announcements
      const announcementsRes = await announcementApi.getByClub(selectedClub.id).catch(() => ({ _embedded: { announcementList: [] } }));
      const announcementsList = extractCollection<any>(announcementsRes) || [];
      setAllAnnouncements(announcementsList);
      setAnnouncements(announcementsList);

      // Load members
      const membersRes = await clubApi.getMembers(selectedClub.id).catch(() => ({ _embedded: { studentResponseDtoList: [] } }));
      const membersList = extractCollection<any>(membersRes) || [];
      setMembers(membersList);
    } catch (error: any) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter announcements
  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery.trim()) return announcements;

    const query = searchQuery.toLowerCase();
    return announcements.filter((announcement) => {
      const title = (announcement.title || '').toLowerCase();
      const description = (announcement.description || '').toLowerCase();
      return title.includes(query) || description.includes(query);
    });
  }, [announcements, searchQuery]);

  const handleSuccess = () => {
    loadData();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch {
      try {
        const date = new Date(dateString);
        return format(date, 'MMM dd, yyyy');
      } catch {
        return dateString;
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Communication & Collaboration' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <Bell className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Communication & Collaboration
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedClub
                ? `Communicate with members of ${selectedClub.title || selectedClub.name || 'Club'}`
                : 'Manage club communications and collaborations'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedClub && activeTab === 'announcements' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2 purple-gold-gradient"
            >
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading || !selectedClub}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="glass-card border-primary/20">
              <TabsTrigger value="announcements" className="gap-2">
                <Bell className="h-4 w-4" />
                Announcements
              </TabsTrigger>
              <TabsTrigger value="discussion" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Discussion Board
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="gap-2">
                <Lightbulb className="h-4 w-4" />
                Suggestion Box
              </TabsTrigger>
              <TabsTrigger value="meetings" className="gap-2">
                <Calendar className="h-4 w-4" />
                Meetings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="announcements" className="mt-6 space-y-6">
              {/* Search Filter */}
              <Card className="glass-card border-primary/20">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search announcements..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10 glass-card border-primary/20"
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

              {/* Announcements List */}
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Club Announcements ({filteredAnnouncements.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : filteredAnnouncements.length === 0 ? (
                    <EmptyState
                      icon={Bell}
                      title="No Announcements"
                      description={
                        searchQuery
                          ? "Try adjusting your search to see more results"
                          : "No announcements have been posted yet. Create the first one!"
                      }
                    />
                  ) : (
                    <div className="space-y-4">
                      {filteredAnnouncements.map((announcement) => (
                        <Card key={announcement.id} className="glass-card border-primary/20 hover:border-primary/40 transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-white mb-2">
                                  {announcement.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {formatDate(announcement.createdAt)}
                                </p>
                                <p className="text-sm text-white whitespace-pre-wrap">
                                  {announcement.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="discussion" className="mt-6">
              <DiscussionBoard clubId={selectedClub.id} />
            </TabsContent>

            <TabsContent value="suggestions" className="mt-6">
              <SuggestionBox clubId={selectedClub.id} members={members} />
            </TabsContent>

            <TabsContent value="meetings" className="mt-6">
              <MeetingScheduler clubId={selectedClub.id} members={members} />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Modals */}
      <CreateAnnouncementDialog
        clubId={selectedClub?.id || 0}
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default SuperUserAnnouncements;

