import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Eye, Pencil, Trash2, Users, Calendar, MoreVertical, LayoutGrid, List } from 'lucide-react';
import { getRoleBadgeColor, getRoleDisplayName } from '@/lib/roles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

interface ClubsListProps {
  clubs: any[];
  events: any[];
  isLoading: boolean;
  viewMode: 'table' | 'card';
  onViewModeChange: (mode: 'table' | 'card') => void;
  onViewDetails: (club: any) => void;
  onEdit: (club: any) => void;
  onDelete: (club: any) => void;
  onViewMembers: (club: any) => void;
  onViewRequests: (club: any) => void;
  onAssignAdmin: (club: any) => void;
}

const ClubsList = ({
  clubs,
  events,
  isLoading,
  viewMode,
  onViewModeChange,
  onViewDetails,
  onEdit,
  onDelete,
  onViewMembers,
  onViewRequests,
  onAssignAdmin,
}: ClubsListProps) => {
  const getClubEventCount = (clubId: number) => {
    return events.filter((event) => event.club?.id === clubId || event.clubId === clubId).length;
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

  if (viewMode === 'card') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {clubs.length} {clubs.length === 1 ? 'club' : 'clubs'}
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'outline' : 'default'}
              size="sm"
              onClick={() => onViewModeChange('table')}
            >
              <List className="h-4 w-4 mr-2" />
              Table
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('card')}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Cards
            </Button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => {
            const eventCount = getClubEventCount(club.id);
            return (
              <Card
                key={club.id}
                className="glass-card border-primary/20 hover:border-primary/40 transition-all hover:scale-105"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-white text-lg truncate">
                          {club.title || club.name || `Club ${club.id}`}
                        </h3>
                      </div>
                      {club.club_Type && (
                        <Badge variant="outline" className="mb-2">
                          {club.club_Type}
                        </Badge>
                      )}
                      <Badge className="bg-success/10 text-success border-success/30 text-xs">
                        Verified
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDetails(club)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewMembers(club)}>
                          <Users className="h-4 w-4 mr-2" />
                          View Members
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewRequests(club)}>
                          <Calendar className="h-4 w-4 mr-2" />
                          View Requests
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(club)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAssignAdmin(club)}>
                          <Building2 className="h-4 w-4 mr-2" />
                          Assign Admin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(club)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {club.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {club.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-primary/20">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{eventCount} events</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(club)}
                      className="h-7 text-xs"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {clubs.length} {clubs.length === 1 ? 'club' : 'clubs'}
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('table')}
          >
            <List className="h-4 w-4 mr-2" />
            Table
          </Button>
          <Button
            variant={viewMode === 'card' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('card')}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Cards
          </Button>
        </div>
      </div>

      <Card className="glass-card border-primary/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Club Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubs.map((club) => {
                  const eventCount = getClubEventCount(club.id);
                  return (
                    <TableRow key={club.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="text-white">
                            {club.title || club.name || `Club ${club.id}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {club.club_Type ? (
                          <Badge variant="outline">{club.club_Type}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {eventCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success/10 text-success border-success/30">
                          Verified
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewDetails(club)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onViewMembers(club)}>
                              <Users className="h-4 w-4 mr-2" />
                              View Members
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onViewRequests(club)}>
                              <Calendar className="h-4 w-4 mr-2" />
                              View Requests
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit(club)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAssignAdmin(club)}>
                              <Building2 className="h-4 w-4 mr-2" />
                              Assign Admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(club)} className="text-destructive">
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
    </div>
  );
};

export default ClubsList;

