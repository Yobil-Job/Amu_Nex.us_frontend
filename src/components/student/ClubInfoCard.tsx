import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, Info } from 'lucide-react';
import { format } from 'date-fns';

interface ClubInfoCardProps {
  club: {
    id: number;
    title?: string;
    name?: string;
    description?: string;
    club_Type?: string;
    logo?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

const ClubInfoCard = ({ club }: ClubInfoCardProps) => {
  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary/10 border-2 border-primary/20">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl mb-1">
                {club.title || club.name || 'Unknown Club'}
              </CardTitle>
              {club.club_Type && (
                <Badge variant="outline" className="mt-1">
                  {club.club_Type}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {club.description && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>About</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {club.description}
            </p>
          </div>
        )}

        {(club.createdAt || club.updatedAt) && (
          <div className="pt-4 border-t space-y-2">
            {club.createdAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  Created: {format(new Date(club.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
            )}
            {club.updatedAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  Last updated: {format(new Date(club.updatedAt), 'MMM dd, yyyy')}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubInfoCard;
