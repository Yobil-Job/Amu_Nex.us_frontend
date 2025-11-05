import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AnnouncementFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  clubFilter: string;
  onClubFilterChange: (club: string) => void;
  dateFilter: string;
  onDateFilterChange: (date: string) => void;
  clubs: any[];
  onClearFilters: () => void;
}

const AnnouncementFilters = ({
  searchQuery,
  onSearchChange,
  clubFilter,
  onClubFilterChange,
  dateFilter,
  onDateFilterChange,
  clubs,
  onClearFilters,
}: AnnouncementFiltersProps) => {
  const hasActiveFilters = searchQuery || clubFilter !== 'all' || dateFilter !== 'all';

  return (
    <Card className="glass-card border-primary/20">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search announcements by title or description..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => onSearchChange('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Club Filter */}
            <Select value={clubFilter} onValueChange={onClubFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Clubs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                <SelectItem value="system">System-Wide (All Clubs)</SelectItem>
                {clubs.map((club) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.title || club.name || `Club ${club.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={onDateFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="older">Older</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnouncementFilters;

