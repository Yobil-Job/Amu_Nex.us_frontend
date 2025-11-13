import { clubApi, authorityApi } from './api';
import { extractCollection } from './hateoas';

/**
 * Loads all clubs managed by a club admin user.
 * Uses two strategies:
 * 1. Check authorities where user is assigned as ADMIN
 * 2. Check clubs where clubAdminId matches user.id (including checking club members)
 * 
 * @param userId - The ID of the club admin user
 * @returns Array of club objects managed by the user
 */
export async function loadManagedClubsForUser(userId: number): Promise<any[]> {
  if (!userId) return [];

  try {
    // Strategy 1: Check authorities where user is assigned as ADMIN
    let clubIdsFromAuthorities: number[] = [];
    try {
      const authoritiesRes = await authorityApi.getByStudent(userId).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
      const userAuthorities = extractCollection<any>(authoritiesRes) || [];

      // Filter authorities where user is the club admin (ADMIN role)
      const adminAuthorities = userAuthorities.filter((auth: any) => {
        const studentId = auth.student?.id || auth.studentId || auth.studentResponseDto?.id;
        const authName = (auth.name || auth.authority || '').toUpperCase();
        const isAdminAuth = authName === 'ADMIN' || authName === 'ROLE_ADMIN';
        const matchesUser = studentId === userId || Number(studentId) === Number(userId);
        return matchesUser && isAdminAuth;
      });

      // Get unique club IDs from authorities
      clubIdsFromAuthorities = [...new Set(
        adminAuthorities.map((auth: any) => {
          const clubId = auth.club?.id || auth.clubId || auth.club?.clubId;
          return clubId != null ? Number(clubId) : null;
        }).filter((id): id is number => id != null)
      )];
    } catch (err) {
      console.warn('Failed to load authorities:', err);
    }

    // Strategy 2: Check all clubs where clubAdminId matches user.id
    // Note: clubAdminId might not be in the list response, so we fetch individual club details
    let clubsFromAdminId: any[] = [];
    try {
      const allClubsRes = await clubApi.getAll().catch(() => ({ _embedded: { responseClubDtoList: [] } }));
      const allClubs = extractCollection<any>(allClubsRes) || [];
      
      // First, try to check clubAdminId in the list response (faster)
      const clubsFromList = allClubs.filter((club: any) => {
        const clubAdminId = club.clubAdminId || 
                           club.club_admin_id || 
                           club.clubAdmin?.id ||
                           club.clubAdminId?.id;
        
        if (clubAdminId == null) return false;
        
        return (
          Number(clubAdminId) === Number(userId) ||
          clubAdminId === userId ||
          String(clubAdminId) === String(userId)
        );
      });

      if (clubsFromList.length > 0) {
        clubsFromAdminId = clubsFromList;
      } else {
        // clubAdminId not in list response, try two approaches:
        // 1. Fetch individual club details (clubAdminId might be there)
        // 2. Check club members to see if user is listed as admin
        const clubCheckPromises = allClubs.map(async (club: any) => {
          try {
            const clubId = club.id || club.clubId;
            if (!clubId) return null;
            
            // Approach 1: Check club details for clubAdminId
            const clubDetails = await clubApi.getById(clubId);
            
            // Check clubAdminId in detailed club object - try multiple field names
            const detailedClubAdminId = clubDetails.clubAdminId || 
                                       clubDetails.club_admin_id || 
                                       clubDetails.clubAdmin?.id ||
                                       clubDetails.clubAdminId?.id ||
                                       (typeof clubDetails.clubAdmin === 'number' ? clubDetails.clubAdmin : null);
            
            // Check if clubAdminId matches
            if (detailedClubAdminId != null && (
              Number(detailedClubAdminId) === Number(userId) ||
              detailedClubAdminId === userId ||
              String(detailedClubAdminId) === String(userId)
            )) {
              return clubDetails;
            }
            
            // Approach 2: Check club members to see if user is admin
            try {
              const membersRes = await clubApi.getMembers(clubId).catch(() => ({ _embedded: { studentResponseDtoList: [] } }));
              const members = extractCollection<any>(membersRes) || [];
              
              // Check if user is a member and has admin role
              const userMember = members.find((member: any) => {
                const memberId = member.id || member.studentId || member.student?.id;
                return memberId != null && (
                  Number(memberId) === Number(userId) ||
                  memberId === userId
                );
              });
              
              if (userMember) {
                // Check if member has ADMIN role
                const memberRole = userMember.role || userMember.authority?.authority;
                const isAdminMember = memberRole === 'ADMIN' || 
                                    memberRole === 'ROLE_ADMIN' ||
                                    (typeof memberRole === 'string' && memberRole.toUpperCase().includes('ADMIN'));
                
                if (isAdminMember) {
                  return clubDetails;
                }
              }
            } catch (memberErr) {
              // Silently fail member check
            }
            
            return null;
          } catch (err) {
            return null;
          }
        });
        
        const detailedClubs = (await Promise.all(clubCheckPromises)).filter(Boolean);
        if (detailedClubs.length > 0) {
          clubsFromAdminId = detailedClubs;
        }
      }
    } catch (err) {
      console.warn('Failed to load clubs:', err);
    }

    // Combine both strategies - get unique club IDs
    const allClubIds = new Set<number>();
    
    // Add club IDs from authorities
    clubIdsFromAuthorities.forEach(id => allClubIds.add(id));
    
    // Add club IDs from clubAdminId
    clubsFromAdminId.forEach(club => {
      const clubId = club.id || club.clubId;
      if (clubId != null) {
        allClubIds.add(Number(clubId));
      }
    });

    // Fetch full club details for all unique club IDs
    const uniqueClubIds = Array.from(allClubIds);
    
    if (uniqueClubIds.length === 0) {
      return [];
    }

    const clubPromises = uniqueClubIds.map(async (clubId: number) => {
      try {
        // If we already have the club from clubsFromAdminId, use it
        const existingClub = clubsFromAdminId.find(c => (c.id || c.clubId) === clubId);
        if (existingClub) {
          return existingClub;
        }
        
        // Otherwise fetch it
        const club = await clubApi.getById(clubId);
        return club;
      } catch {
        return null;
      }
    });

    const clubs = (await Promise.all(clubPromises)).filter(Boolean);
    return clubs;
  } catch (error) {
    console.error('Failed to load managed clubs:', error);
    return [];
  }
}

