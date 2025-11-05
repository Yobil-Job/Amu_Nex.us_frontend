import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bell, Building2, Clock, Eye, Pencil, Trash2, MoreVertical, Globe, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
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
  onSchedule?: (announcement: any) => void;
}

const AnnouncementsList = ({
  announcements,
  isLoading,
  onViewDetails,
  onEdit,
  onDelete,
  onSchedule,
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

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (announcements.length === 0) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-12">
          <div className="text-center">
            <Bell className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg">No announcements found</p>
            <p className="text-muted-foreground text-sm mt-2">
              Try adjusting your filters or create a new announcement
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Posted Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((announcement) => {
                const club = announcement.club || {};
                const isSystemWide = !club.id;

                return (
                  <TableRow key={announcement.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium text-white">
                            {announcement.title || 'Untitled Announcement'}
                          </div>
                          {announcement.scheduledAt && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Scheduled
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isSystemWide ? (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-accent" />
                          <span className="text-white">System-Wide</span>
                          <Badge variant="default" className="text-xs">All Clubs</Badge>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-accent" />
                          <span className="text-white">
                            {club.title || club.name || `Club ${club.id}`}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                        {announcement.description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(announcement.createdAt || announcement.scheduledAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(announcement)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {onSchedule && (
                            <DropdownMenuItem onClick={() => onSchedule(announcement)}>
                              <Calendar className="h-4 w-4 mr-2" />
                              {announcement.scheduledAt ? 'Reschedule' : 'Schedule'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEdit(announcement)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(announcement)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnouncementsList;

