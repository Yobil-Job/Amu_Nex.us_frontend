import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface FeeFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  clubFilter: string;
  onClubFilterChange: (club: string) => void;
  studentFilter: string;
  onStudentFilterChange: (student: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
  clubs: any[];
  students: any[];
  onClearFilters: () => void;
}

const FeeFilters = ({
  searchQuery,
  onSearchChange,
  clubFilter,
  onClubFilterChange,
  studentFilter,
  onStudentFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  clubs,
  students,
  onClearFilters,
}: FeeFiltersProps) => {
  const hasActiveFilters = 
    searchQuery || 
    clubFilter !== 'all' || 
    studentFilter !== 'all' || 
    statusFilter !== 'all' || 
    dateFrom || 
    dateTo;

  return (
    <Card className="glass-card border-primary/20">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, email, or purpose..."
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
            {/* Club Filter */}
            <Select value={clubFilter} onValueChange={onClubFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Clubs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {clubs.map((club) => (
                  <SelectItem key={club.id} value={club.id.toString()}>
                    {club.title || club.name || `Club ${club.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Student Filter */}
            <Select value={studentFilter} onValueChange={onStudentFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {students.slice(0, 50).map((student) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.firstname} {student.lastname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <div className="space-y-2">
              <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">From Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onDateFromChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Date To */}
          {dateFrom && (
            <div className="space-y-2">
              <Label htmlFor="dateTo" className="text-xs text-muted-foreground">To Date</Label>
              <div className="relative max-w-xs">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange(e.target.value)}
                  className="pl-10"
                  min={dateFrom}
                />
              </div>
            </div>
          )}

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

export default FeeFilters;

