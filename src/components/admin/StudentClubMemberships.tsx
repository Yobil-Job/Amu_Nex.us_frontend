import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { studentApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { useEffect, useState } from 'react';

interface StudentClubMembershipsProps {
  studentId: number;
}

const StudentClubMemberships = ({ studentId }: StudentClubMembershipsProps) => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClubs();
  }, [studentId]);

  const loadClubs = async () => {
    setIsLoading(true);
    try {
      const response = await studentApi.getClubs(studentId);
      const clubsList = extractCollection<any>(response) || [];
      setClubs(clubsList);
    } catch (error) {
      console.error('Failed to load clubs:', error);
      setClubs([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Club Memberships
        </CardTitle>
        <CardDescription>
          {clubs.length} {clubs.length === 1 ? 'club' : 'clubs'} joined
        </CardDescription>
      </CardHeader>
      <CardContent>
        {clubs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No club memberships</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clubs.map((club) => (
              <div
                key={club.id}
                className="glass-card p-3 rounded-lg border border-primary/20 hover:bg-primary/10 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">
                      {club.title || club.name || `Club ${club.id}`}
                    </div>
                    {club.club_Type && (
                      <Badge variant="outline" className="text-xs mb-2">
                        {club.club_Type}
                      </Badge>
                    )}
                    {club.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {club.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>Member</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentClubMemberships;

