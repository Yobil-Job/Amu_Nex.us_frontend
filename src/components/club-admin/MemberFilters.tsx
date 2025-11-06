import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MemberFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roleFilter: string;
  onRoleChange: (role: string) => void;
  departmentFilter: string;
  onDepartmentChange: (department: string) => void;
  yearFilter: string;
  onYearChange: (year: string) => void;
  departments: string[];
  onClearFilters: () => void;
}

const MemberFilters = ({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleChange,
  departmentFilter,
  onDepartmentChange,
  yearFilter,
  onYearChange,
  departments,
  onClearFilters,
}: MemberFiltersProps) => {
  const hasActiveFilters = searchQuery || roleFilter !== 'all' || departmentFilter !== 'all' || yearFilter !== 'all';

  return (
    <Card className="glass-card border-primary/20">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or department..."
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Department Filter */}
            <Select value={departmentFilter} onValueChange={onDepartmentChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year Filter */}
            <Select value={yearFilter} onValueChange={onYearChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="First_Year">First Year</SelectItem>
                <SelectItem value="Second_Year">Second Year</SelectItem>
                <SelectItem value="Third_Year">Third Year</SelectItem>
                <SelectItem value="Fourth_Year">Fourth Year</SelectItem>
                <SelectItem value="Fivth_Year">Fifth Year</SelectItem>
                <SelectItem value="Sixth_Year">Sixth Year</SelectItem>
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={onRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="AUTHORITY">Authority</SelectItem>
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

export default MemberFilters;

