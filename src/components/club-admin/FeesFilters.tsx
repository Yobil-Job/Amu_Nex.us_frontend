import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Calendar, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FeesFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  memberFilter: string;
  onMemberFilterChange: (member: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
  members: any[];
  onClearFilters: () => void;
}

const FeesFilters = ({
  searchQuery,
  onSearchChange,
  memberFilter,
  onMemberFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  members,
  onClearFilters,
}: FeesFiltersProps) => {
  const hasActiveFilters = searchQuery || memberFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo;

  return (
    <Card className="glass-card border-primary/20">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name or email..."
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Member Filter */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select value={memberFilter} onValueChange={onMemberFilterChange}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="All Members" />
                </SelectTrigger>
                <SelectContent className="glass-card border-primary/20">
                  <SelectItem value="all">All Members</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.firstname} {member.lastname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="glass-card border-primary/20">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="pl-10"
                placeholder="From Date"
              />
            </div>

            {/* Date To */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="pl-10"
                placeholder="To Date"
                min={dateFrom || undefined}
              />
            </div>
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

export default FeesFilters;

