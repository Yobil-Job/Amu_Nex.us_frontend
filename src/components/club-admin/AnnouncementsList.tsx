import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Clock, Eye, Pencil, Trash2, Pin, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/admin/EmptyState';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AnnouncementsListProps {
  announcements: any[];
  isLoading: boolean;
  onViewDetails: (announcement: any) => void;
  onEdit: (announcement: any) => void;
  onDelete: (announcement: any) => void;
  currentUserId?: number;
}

const AnnouncementsList = ({
  announcements,
  isLoading,
  onViewDetails,
  onEdit,
  onDelete,
  currentUserId,
}: AnnouncementsListProps) => {
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

  // Sort announcements: pinned first, then by date (newest first)
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    // Pinned announcements first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    // Then by date (newest first)
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedAnnouncements.length === 0) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <EmptyState
            icon={Bell}
            title="No Announcements"
            description="No announcements have been created yet. Create your first announcement to communicate with club members."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedAnnouncements.map((announcement) => {
        const creator = announcement.createdBy || announcement.creator || {};
        const club = announcement.club || {};
        
        // For club admin pages, they can edit/delete all announcements in their managed clubs
        // So we always show edit/delete buttons (currentUserId is passed but not required for club admin)
        const canEditDelete = true; // Club admins can manage all announcements

        return (
          <Card
            key={announcement.id}
            className={`glass-card border-primary/20 hover:border-primary/40 transition-all ${
              announcement.pinned ? 'border-primary/60 bg-primary/5' : ''
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {announcement.pinned && (
                      <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                        <Pin className="h-3 w-3 mr-1" />
                        Pinned
                      </Badge>
                    )}
                    <h3 className="font-semibold text-lg text-white line-clamp-1">
                      {announcement.title || 'Untitled Announcement'}
                    </h3>
                  </div>

                  <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {announcement.description || 'No description'}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(announcement.createdAt)}</span>
                    </div>
                    {creator.firstname && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>
                          {creator.firstname} {creator.lastname}
                        </span>
                      </div>
                    )}
                    {club.title && (
                      <div className="flex items-center gap-1">
                        <span className="text-primary">{club.title || club.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(announcement)}
                    className="h-8 w-8 p-0 text-accent hover:text-accent hover:bg-accent/10"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canEditDelete && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(announcement)}
                        className="h-8 w-8 p-0 text-accent hover:text-accent hover:bg-accent/10"
                        title="Edit Announcement"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(announcement)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete Announcement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AnnouncementsList;

