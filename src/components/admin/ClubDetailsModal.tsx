import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Calendar, Bell, TrendingUp, Shield, CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import ClubMembersList from './ClubMembersList';
import { extractCollection } from '@/lib/hateoas';
import { clubApi, eventApi, announcementApi } from '@/lib/api';
import { useEffect, useState } from 'react';

interface ClubDetailsModalProps {
  club: any;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

const ClubDetailsModal = ({ club, isOpen, onClose, isLoading }: ClubDetailsModalProps) => {
  const [members, setMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (club?.id && isOpen) {
      loadClubData();
    }
  }, [club?.id, isOpen]);

  const loadClubData = async () => {
    if (!club?.id) return;
    setIsLoadingData(true);
    try {
      const [membersRes, eventsRes, announcementsRes, requestsRes] = await Promise.all([
        clubApi.getMembers(club.id).catch(() => []),
        eventApi.getByClub(club.id).catch(() => ({ _embedded: { eventList: [] } })),
        announcementApi.getByClub(club.id).catch(() => ({ _embedded: { announcementResponseDtoList: [] } })),
        clubApi.getPendingRequests(club.id).catch(() => ({ _embedded: { requestResponseDtoList: [] } })),
      ]);

      // Handle different response formats for members
      let membersList: any[] = [];
      if (Array.isArray(membersRes)) {
        membersList = membersRes;
      } else if (membersRes?._embedded) {
        membersList = extractCollection<any>(membersRes) || [];
      }

      const eventsList = extractCollection<any>(eventsRes) || [];
      const announcementsList = extractCollection<any>(announcementsRes) || [];
      const requestsList = extractCollection<any>(requestsRes) || [];

      setMembers(membersList);
      setEvents(eventsList);
      setAnnouncements(announcementsList);
      setPendingRequests(requestsList);
    } catch (error) {
      console.error('Failed to load club data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  if (!club && !isLoading) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const upcomingEvents = events.filter((event) => {
    if (!event.startAt) return false;
    try {
      return new Date(event.startAt) > new Date();
    } catch {
      return false;
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span>{club?.title || club?.name || 'Club Details'}</span>
                {club?.club_Type && (
                  <Badge variant="outline">{club.club_Type}</Badge>
                )}
                <Badge className="bg-success/10 text-success border-success/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-base">
            Complete club information and statistics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Club Info */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="glass-card p-4 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-white">Members</h3>
              </div>
              <div className="text-2xl font-bold text-white">{members.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {pendingRequests.length} pending requests
              </div>
            </div>

            <div className="glass-card p-4 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-accent" />
                <h3 className="font-semibold text-white">Events</h3>
              </div>
              <div className="text-2xl font-bold text-white">{events.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {upcomingEvents.length} upcoming
              </div>
            </div>

            <div className="glass-card p-4 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-5 w-5 text-warning" />
                <h3 className="font-semibold text-white">Announcements</h3>
              </div>
              <div className="text-2xl font-bold text-white">{announcements.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Total posted</div>
            </div>
          </div>

          {/* Description */}
          {club?.description && (
            <div className="glass-card p-4 rounded-lg border border-primary/20">
              <h3 className="font-semibold text-white mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{club.description}</p>
            </div>
          )}

          {/* Members List */}
          <ClubMembersList members={members} isLoading={isLoadingData} clubId={club?.id || 0} />

          {/* Recent Activity */}
          <div className="glass-card p-4 rounded-lg border border-primary/20">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recent Activity
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {events.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-white">{event.title}</span>
                  {event.startAt && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(event.startAt), 'MMM dd, yyyy')}
                    </span>
                  )}
                </div>
              ))}
              {announcements.slice(0, 2).map((announcement) => (
                <div key={announcement.id} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-primary/10">
                  <Bell className="h-4 w-4 text-warning" />
                  <span className="text-white">{announcement.title}</span>
                  {announcement.createdAt && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(announcement.createdAt), 'MMM dd, yyyy')}
                    </span>
                  )}
                </div>
              ))}
              {events.length === 0 && announcements.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClubDetailsModal;

