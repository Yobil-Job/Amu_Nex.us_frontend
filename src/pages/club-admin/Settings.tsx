import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Settings as SettingsIcon, RefreshCw } from 'lucide-react';
import { clubApi, authorityApi } from '@/lib/api';
import { extractCollection } from '@/lib/hateoas';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import ClubSettingsForm from '@/components/club-admin/ClubSettingsForm';
import { Button } from '@/components/ui/button';

const ClubAdminSettings = () => {
  const { user } = useAuth();
  const [managedClubs, setManagedClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [club, setClub] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadManagedClubs();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedClub?.id) {
      loadClub();
    }
  }, [selectedClub?.id]);

  // Load clubs where user is assigned as club admin (ADMIN role)
  const loadManagedClubs = async () => {
    try {
      // Get all authorities for the current user
      const authoritiesRes = await authorityApi.getByStudent(user?.id || 0).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
      const allAuthorities = extractCollection<any>(authoritiesRes) || [];

      // Filter authorities where user is the club admin (ADMIN role)
      const userAuthorities = allAuthorities.filter((auth: any) => {
        const studentId = auth.student?.id || auth.studentId;
        const authName = (auth.name || '').toUpperCase();
        return studentId === user?.id && authName === 'ADMIN';
      });

      const clubIds = [...new Set(userAuthorities.map((auth: any) => auth.club?.id || auth.clubId))].filter(Boolean);

      if (clubIds.length === 0) {
        toast.info('You are not assigned as a club admin for any club yet. Please contact the system administrator.');
        setIsLoading(false);
        return;
      }

      const clubPromises = clubIds.map(async (clubId: number) => {
        try {
          const club = await clubApi.getById(clubId);
          return club;
        } catch {
          return null;
        }
      });

      const clubs = (await Promise.all(clubPromises)).filter(Boolean);
      setManagedClubs(clubs);

      if (clubs.length === 1) {
        setSelectedClub(clubs[0]);
      } else if (clubs.length > 1) {
        setSelectedClub(clubs[0]);
      }
    } catch (error: any) {
      toast.error('Failed to load your clubs');
      setIsLoading(false);
    }
  };

  const loadClub = async () => {
    if (!selectedClub?.id) return;

    setIsLoading(true);
    try {
      const clubData = await clubApi.getById(selectedClub.id);
      setClub(clubData);
    } catch (error: any) {
      toast.error('Failed to load club details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    if (!selectedClub?.id) return;

    setIsSaving(true);
    try {
      // Prepare update payload - only include fields that have values
      const updatePayload: any = {
        title: data.title,
      };

      if (data.description) {
        updatePayload.description = data.description;
      }
      if (data.logo) {
        updatePayload.logo = data.logo;
      }
      if (data.visibility) {
        // Map visibility to isPublic if backend expects boolean
        updatePayload.isPublic = data.visibility === 'PUBLIC';
      }
      if (data.email) {
        updatePayload.email = data.email;
      }
      if (data.website) {
        updatePayload.website = data.website;
      }
      if (data.facebook) {
        updatePayload.facebook = data.facebook;
      }
      if (data.twitter) {
        updatePayload.twitter = data.twitter;
      }
      if (data.instagram) {
        updatePayload.instagram = data.instagram;
      }

      await clubApi.update(selectedClub.id, updatePayload);
      
      // Reload club data to reflect changes
      await loadClub();
    } catch (error: any) {
      throw error; // Re-throw to let the form handle the error
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !club) {
    return (
      <div className="space-y-8 animate-fade-in min-h-screen pb-8">
        <Breadcrumbs items={[{ label: 'Club Settings' }]} />
        <Card className="glass-card border-primary/20">
          <CardContent className="p-12">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <Skeleton className="h-96 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in min-h-screen pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Club Settings' }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary shadow-colored-primary">
            <SettingsIcon className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight neon-text text-white flex items-center gap-3">
              Club Settings
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedClub
                ? `Manage settings for ${selectedClub.title || selectedClub.name || 'Club'}`
                : 'Select a club to manage settings'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedClub && (
            <Button
              variant="outline"
              size="sm"
              onClick={loadClub}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      <div className="luxury-divider"></div>

      {/* Club Selector (if managing multiple clubs) */}
      {managedClubs.length > 1 && (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-white">Select Club:</label>
              <select
                value={selectedClub?.id || ''}
                onChange={(e) => {
                  const club = managedClubs.find((c) => c.id === Number(e.target.value));
                  setSelectedClub(club || null);
                  setClub(null); // Clear current club data
                }}
                className="glass-card border-primary/20 px-4 py-2 rounded-lg bg-background text-white flex-1 max-w-md"
              >
                {managedClubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.title || club.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedClub ? (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-12 text-center">
            <SettingsIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">No Club Assigned</h3>
            <p className="text-muted-foreground">
              You are not assigned as a club admin for any club yet. Please contact the system administrator.
            </p>
          </CardContent>
        </Card>
      ) : !club ? (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-12">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <Skeleton className="h-96 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <ClubSettingsForm club={club} onSave={handleSave} isLoading={isSaving} />
      )}
    </div>
  );
};

export default ClubAdminSettings;

