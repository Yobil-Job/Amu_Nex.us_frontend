import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Clock, User, MapPin, MoreVertical, ArrowRightLeft } from 'lucide-react';
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

interface ResourcesListProps {
  resources: any[];
  isLoading: boolean;
  onLend: (resource: any) => void;
  onReturn: (resource: any) => void;
  onEdit: (resource: any) => void;
  onDelete: (resource: any) => void;
  onViewHistory: (resource: any) => void;
  viewMode?: 'list' | 'grid';
}

const ResourcesList = ({
  resources,
  isLoading,
  onLend,
  onReturn,
  onEdit,
  onDelete,
  onViewHistory,
  viewMode = 'list',
}: ResourcesListProps) => {
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

  const getStatusBadge = (resource: any) => {
    if (resource.lentTo) {
      return (
        <Badge className="bg-warning/10 text-warning border-warning/30">
          <ArrowRightLeft className="h-3 w-3 mr-1" />
          Lent Out
        </Badge>
      );
    } else if (resource.status === 'MAINTENANCE') {
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/30">
          Under Maintenance
        </Badge>
      );
    } else if (resource.status === 'AVAILABLE') {
      return (
        <Badge className="bg-success/10 text-success border-success/30">
          Available
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-muted text-muted-foreground">
          {resource.status || 'Available'}
        </Badge>
      );
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

  if (resources.length === 0) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <EmptyState
            icon={Package}
            title="No Resources"
            description="No club resources have been added yet. Add your first resource to get started."
          />
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource.id} className="glass-card border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-gradient-primary">
                  <Package className="h-5 w-5 text-primary-foreground" />
                </div>
                {getStatusBadge(resource)}
              </div>
              
              <h3 className="font-semibold text-lg text-white mb-2 line-clamp-1">
                {resource.name || 'Unnamed Resource'}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {resource.description || 'No description'}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Category: {resource.category || 'N/A'}</span>
                </div>
                {resource.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{resource.location}</span>
                  </div>
                )}
                {resource.lentTo && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Lent to: {resource.lentTo}</span>
                  </div>
                )}
                {resource.lentDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Since: {formatDate(resource.lentDate)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {!resource.lentTo && resource.status === 'AVAILABLE' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLend(resource)}
                    className="flex-1"
                  >
                    Lend
                  </Button>
                )}
                {resource.lentTo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReturn(resource)}
                    className="flex-1"
                  >
                    Return
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-card border-primary/20 bg-background/95 backdrop-blur-md">
                    <DropdownMenuItem
                      onClick={() => onViewHistory(resource)}
                      className="cursor-pointer text-white focus:text-white focus:bg-primary/20"
                    >
                      <Clock className="h-4 w-4 mr-2 text-white" />
                      <span className="text-white">View History</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-primary/20" />
                    <DropdownMenuItem
                      onClick={() => onEdit(resource)}
                      className="cursor-pointer text-white focus:text-white focus:bg-primary/20"
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(resource)}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // List view
  return (
    <Card className="glass-card border-primary/20">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/20">
                <th className="text-left p-4 text-white font-semibold">Resource</th>
                <th className="text-left p-4 text-white font-semibold">Category</th>
                <th className="text-left p-4 text-white font-semibold">Location</th>
                <th className="text-left p-4 text-white font-semibold">Status</th>
                <th className="text-left p-4 text-white font-semibold">Lent To</th>
                <th className="text-right p-4 text-white font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr
                  key={resource.id}
                  className="border-b border-primary/20 hover:bg-primary/10 transition-colors"
                >
                  <td className="p-4">
                    <div>
                      <div className="font-semibold text-white mb-1">
                        {resource.name || 'Unnamed Resource'}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {resource.description || 'No description'}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-white">
                    {resource.category || 'N/A'}
                  </td>
                  <td className="p-4 text-white">
                    {resource.location || 'N/A'}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(resource)}
                  </td>
                  <td className="p-4">
                    {resource.lentTo ? (
                      <div className="flex items-center gap-2 text-white">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{resource.lentTo}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {!resource.lentTo && resource.status === 'AVAILABLE' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onLend(resource)}
                          className="text-accent hover:text-accent hover:bg-accent/10"
                        >
                          Lend
                        </Button>
                      )}
                      {resource.lentTo && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReturn(resource)}
                          className="text-success hover:text-success hover:bg-success/10"
                        >
                          Return
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-card border-primary/20 bg-background/95 backdrop-blur-md">
                          <DropdownMenuItem
                            onClick={() => onViewHistory(resource)}
                            className="cursor-pointer text-white focus:text-white focus:bg-primary/20"
                          >
                            <Clock className="h-4 w-4 mr-2 text-white" />
                            <span className="text-white">View History</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-primary/20" />
                          <DropdownMenuItem
                            onClick={() => onEdit(resource)}
                            className="cursor-pointer text-white focus:text-white focus:bg-primary/20"
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(resource)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourcesList;

