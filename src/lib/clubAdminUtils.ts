import { clubApi, authorityApi, studentApi } from './api';
import { extractCollection } from './hateoas';

/**
 * Loads all clubs managed by a club admin user or authority user.
 * Uses three strategies:
 * 1. Check ALL authorities where user is assigned (including ADMIN, President, Secretary, etc.)
 * 2. Check clubs where clubAdminId matches user.id (including checking club members)
 * 3. Check HATEOAS links in authorities to extract club IDs
 * 
 * @param userId - The ID of the club admin or authority user
 * @returns Array of club objects managed by the user
 */
export async function loadManagedClubsForUser(userId: number): Promise<any[]> {
  if (!userId) return [];

  try {
    // Strategy 1: Check ALL authorities where user is assigned (not just ADMIN)
    // This includes ADMIN authorities (for club admins) and other authorities (President, Secretary, etc.)
    let clubIdsFromAuthorities: number[] = [];
    try {
      const authoritiesRes = await authorityApi.getByStudent(userId).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
      const userAuthorities = extractCollection<any>(authoritiesRes) || [];

      // Include ALL authorities for this user (not just ADMIN)
      // This allows both ADMIN role users and SUPER_USER (authority) users to see their clubs
      const userAuthoritiesFiltered = userAuthorities.filter((auth: any) => {
        const studentId = auth.student?.id || auth.studentId || auth.studentResponseDto?.id;
        const matchesUser = studentId === userId || Number(studentId) === Number(userId);
        return matchesUser;
      });

      // Extract club IDs from all authorities (try multiple strategies)
      const authorityIds = userAuthoritiesFiltered.map(auth => auth.id).filter(Boolean);
      
      for (const auth of userAuthoritiesFiltered) {
        let clubId: number | null = null;
        
        // Strategy 1a: Check direct fields in authority object
        clubId = auth.club?.id || 
                 auth.clubId || 
                 auth.club?.clubId ||
                 auth.club_id ||
                 (typeof auth.club === 'number' ? auth.club : null);

        // Strategy 1b: If not found, try HATEOAS link
        if (!clubId) {
          try {
            const clubLink = auth._links?.club?.href;
            if (clubLink) {
              const match = clubLink.match(/\/clubs\/(\d+)/);
              if (match && match[1]) {
                clubId = Number(match[1]);
              }
            }
          } catch (err) {
            // Silently continue
          }
        }
        
        // Strategy 1c: If still not found, try to get from club authorities (fallback)
        // This is needed when authority object doesn't include club info and getById fails
        if (!clubId && auth.id) {
          // Don't call getById if it's likely to fail (we'll use fallback strategy instead)
          // This will be handled by the fallback below
        }
        
        if (clubId != null) {
          clubIdsFromAuthorities.push(Number(clubId));
        }
      }

      // Fallback Strategy: If we couldn't extract club IDs directly, check clubs
      // This handles cases where authority objects don't include club info
      if (clubIdsFromAuthorities.length === 0 && authorityIds.length > 0) {
        try {
          // Try to get all clubs first (works for ADMIN, but not SUPER_USER)
          let allClubs: any[] = [];
          const allClubsRes = await clubApi.getAll().catch(() => {
            // If getAll() fails (e.g., for SUPER_USER), try getting student's clubs instead
            return null;
          });
          
          if (allClubsRes) {
            allClubs = extractCollection<any>(allClubsRes) || [];
          } else {
            // Fallback: Get clubs the student is a member of
            const studentClubsRes = await studentApi.getClubs(userId).catch(() => ({ _embedded: { responseClubDtoList: [] } }));
            allClubs = extractCollection<any>(studentClubsRes) || [];
          }
          
          // For each club, check if it has any of our user's authorities
          const clubCheckPromises = allClubs.map(async (club: any) => {
            try {
              const clubId = club.id || club.clubId;
              if (!clubId) return null;

              // Get authorities for this club
              const clubAuthoritiesRes = await authorityApi.getByClub(clubId).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
              const clubAuthorities = extractCollection<any>(clubAuthoritiesRes) || [];

              // Check if any of the club's authorities match our user's authority IDs
              const matchingAuth = clubAuthorities.find((clubAuth: any) => {
                const clubAuthId = clubAuth.id;
                return clubAuthId != null && authorityIds.includes(Number(clubAuthId));
              });

              if (matchingAuth) {
                // Also verify the student matches
                const studentId = matchingAuth.student?.id || matchingAuth.studentId || matchingAuth.studentResponseDto?.id;
                const matchesUser = studentId === userId || Number(studentId) === Number(userId);
                
                if (matchesUser) {
                  return clubId;
                }
              }
              
              return null;
            } catch (err) {
              return null;
            }
          });

          const foundClubIds = (await Promise.all(clubCheckPromises)).filter((id): id is number => id != null);
          clubIdsFromAuthorities.push(...foundClubIds);
        } catch (err) {
          // Silently continue
        }
      }

      // Get unique club IDs
      clubIdsFromAuthorities = [...new Set(clubIdsFromAuthorities)];
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

