import { clubApi, authorityApi } from './api';
import { extractCollection } from './hateoas';

/**
 * Loads the club(s) assigned to a SUPER_USER (authority).
 * SUPER_USER authorities are assigned by club admin and have positions like "President", "Secretary", etc.
 * (Not "ADMIN" - that's for club admins)
 * 
 * @param userId - The ID of the SUPER_USER
 * @returns Array of club objects the user is authorized for
 */
export async function loadAuthorizedClubsForUser(userId: number): Promise<any[]> {
  if (!userId) {
    console.warn('⚠️ [superUserUtils] loadAuthorizedClubsForUser called with invalid userId:', userId);
    return [];
  }

  try {
      console.log('🔍 [superUserUtils] Loading authorized clubs for user:', userId);

    // Strategy: Use getByStudent() to get user's authorities, then extract club IDs
    // This avoids calling clubApi.getAll() which may fail with 500 for SUPER_USER
    console.log('🔍 [superUserUtils] Calling API: GET /authorities/students/' + userId);
    const authoritiesRes = await authorityApi.getByStudent(userId).catch((err) => {
      console.error('❌ [superUserUtils] Failed to get authorities by student:', {
        userId,
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        status: (err as any)?.status,
        response: (err as any)?.response,
        fullError: JSON.stringify(err, null, 2),
      });
      return { _embedded: { authorityResponseDtoList: [] } };
    });
    
    console.log('📥 [superUserUtils] Raw API response received:', {
      type: typeof authoritiesRes,
      isArray: Array.isArray(authoritiesRes),
      hasEmbedded: !!authoritiesRes?._embedded,
      fullResponse: JSON.stringify(authoritiesRes, null, 2),
    });
    
    const userAuthorities = extractCollection<any>(authoritiesRes) || [];

    console.log('🔍 [superUserUtils] Raw authorities response structure:', {
      hasEmbedded: !!authoritiesRes._embedded,
      embeddedKeys: authoritiesRes._embedded ? Object.keys(authoritiesRes._embedded) : [],
      allKeys: Object.keys(authoritiesRes),
    });
    console.log('🔍 [superUserUtils] Extracted authorities count:', userAuthorities.length);
    
    if (userAuthorities.length > 0) {
      const sampleAuth = userAuthorities[0];
      console.log('✅ [superUserUtils] Found authorities for user. Sample authority:', {
        id: sampleAuth.id,
        name: sampleAuth.name,
        authority: sampleAuth.authority,
        // Note: club field is @JsonIgnore in backend, so it won't be in response
        club: sampleAuth.club,
        clubId: sampleAuth.clubId,
        student: sampleAuth.student,
        studentId: sampleAuth.studentId,
        keys: Object.keys(sampleAuth),
        _links: sampleAuth._links,
        // CRITICAL: Check if HATEOAS club link exists
        hasClubLink: !!sampleAuth._links?.club,
        clubLink: sampleAuth._links?.club?.href,
      });
      
      // Log all authorities with their HATEOAS links
      userAuthorities.forEach((auth, index) => {
        console.log(`📋 [superUserUtils] Authority ${index + 1}:`, {
          id: auth.id,
          name: auth.name,
          clubLink: auth._links?.club?.href || 'MISSING',
        });
      });
    } else {
      console.warn('⚠️ [superUserUtils] No authorities found for user', userId);
      console.warn('⚠️ [superUserUtils] This user may not be assigned as an authority to any club.');
      console.warn('⚠️ [superUserUtils] Raw response:', JSON.stringify(authoritiesRes, null, 2));
    }

    if (userAuthorities.length === 0) {
      console.warn('⚠️ [superUserUtils] No authorities found for user. Returning empty array.');
      return [];
    }

    // Extract club IDs from authorities (same approach as MainLayout for club admin)
    const clubIds: number[] = [];
    
    for (const auth of userAuthorities) {
      // Exclude ADMIN authorities (those are for club admins)
      const authName = (auth.name || auth.authority || '').toUpperCase();
      const isAdminAuth = authName === 'ADMIN' || authName === 'ROLE_ADMIN';
      
      if (isAdminAuth) {
        if (import.meta.env.DEV) {
          console.log('⚠️ [superUserUtils] Skipping ADMIN authority:', auth.id);
        }
        continue;
      }

      // Extract club ID from authority object
      // NOTE: Backend has @JsonIgnore on club field, so we MUST use HATEOAS links
      let clubId: number | null = null;
      
      // Strategy 1: Try HATEOAS link FIRST (most reliable since club is @JsonIgnore)
      try {
        const clubLink = auth._links?.club?.href;
        if (clubLink) {
          // Handle both "/clubs/5" and "http://localhost:8080/clubs/5" formats
          const match = clubLink.match(/\/clubs\/(\d+)/);
          if (match && match[1]) {
            clubId = Number(match[1]);
            console.log('✅ [superUserUtils] Found club ID from HATEOAS link:', clubId, 'for authority:', auth.name);
          }
        }
      } catch (err) {
        console.warn('⚠️ [superUserUtils] Failed to extract club ID from HATEOAS:', err);
      }

      // Strategy 2: Check direct fields in authority object (fallback - may not work due to @JsonIgnore)
      if (!clubId) {
        clubId = auth.club?.id || 
                 auth.clubId || 
                 auth.club?.clubId ||
                 auth.club_id ||
                 (typeof auth.club === 'number' ? auth.club : null);
        
        if (clubId) {
          console.log('✅ [superUserUtils] Found club ID from authority object:', clubId, 'for authority:', auth.name);
        }
      }

      // Strategy 3: Skip - fetching individual authorities returns 500 "Access Denied" for SUPER_USER
      // We'll use alternative approach below to find clubs via student membership

      if (clubId) {
        clubIds.push(clubId);
        console.log('✅ [superUserUtils] Added club ID to list:', clubId, 'for authority:', auth.name);
      } else {
        console.error('❌ [superUserUtils] Could not extract club ID from authority:', {
          authId: auth.id,
          authName: auth.name,
          authKeys: Object.keys(auth),
          // Note: club field is @JsonIgnore, so it won't be in response
          club: auth.club,
          clubId: auth.clubId,
          // CRITICAL: Check HATEOAS links
          hasLinks: !!auth._links,
          links: auth._links,
          clubLink: auth._links?.club?.href || 'MISSING',
          allLinks: auth._links ? Object.keys(auth._links) : [],
        });
        console.error('❌ [superUserUtils] Full authority object:', JSON.stringify(auth, null, 2));
      }
    }

    // Get unique club IDs
    const uniqueClubIds = [...new Set(clubIds)];

      console.log('🏛️ [superUserUtils] Unique club IDs found:', uniqueClubIds);

    // Store student clubs data for later use (to avoid re-fetching and permission issues)
    let studentClubsData: any[] = [];
    
    // If we couldn't extract club IDs from authorities (backend doesn't provide club links),
    // use alternative approach: If user has authorities AND is a member of clubs, use those clubs
    // This works because: if user has an authority, they must be assigned to a club (authority requires club)
    if (uniqueClubIds.length === 0 && userAuthorities.length > 0) {
      console.warn('⚠️ [superUserUtils] No club IDs extracted from authorities');
      console.warn('⚠️ [superUserUtils] Using alternative approach: Get user clubs (user has authorities, so must be in a club)...');
      
      try {
        // Get clubs the user is a member of
        const { studentApi } = await import('./api');
        const studentClubsRes = await studentApi.getClubs(userId).catch(() => []);
        studentClubsData = Array.isArray(studentClubsRes) ? studentClubsRes : extractCollection<any>(studentClubsRes) || [];
        
        console.log('🔍 [superUserUtils] Found', studentClubsData.length, 'clubs user is member of');
        console.log('🔍 [superUserUtils] Student clubs data:', JSON.stringify(studentClubsData, null, 2));
        
        if (studentClubsData.length > 0) {
          // Since user has authorities and is a member of clubs, use those clubs
          // (An authority must be assigned to a club, so if they have authorities, they're in those clubs)
          const clubIdsFromMembership = studentClubsData
            .map((club: any) => {
              const id = club.id || club.clubId;
              console.log('🔍 [superUserUtils] Extracting club ID from:', { club, extractedId: id });
              return id;
            })
            .filter((id): id is number => id != null && !isNaN(Number(id)));
          
          console.log('🔍 [superUserUtils] Extracted club IDs from membership:', clubIdsFromMembership);
          
          if (clubIdsFromMembership.length > 0) {
            console.log('✅ [superUserUtils] Using clubs from membership (user has', userAuthorities.length, 'authority/authorities):', clubIdsFromMembership);
            // Add to uniqueClubIds and ensure uniqueness
            clubIdsFromMembership.forEach(id => {
              const numId = Number(id);
              if (!isNaN(numId) && !uniqueClubIds.includes(numId)) {
                uniqueClubIds.push(numId);
                console.log('✅ [superUserUtils] Added club ID to unique list:', numId);
              }
            });
            // Update the uniqueClubIds array to remove duplicates
            const uniqueSet = new Set(uniqueClubIds);
            uniqueClubIds.length = 0;
            uniqueClubIds.push(...Array.from(uniqueSet));
            console.log('✅ [superUserUtils] Final unique club IDs after membership check:', uniqueClubIds);
          } else {
            console.warn('⚠️ [superUserUtils] Could not extract valid club IDs from student clubs');
          }
        } else {
          console.warn('⚠️ [superUserUtils] User has authorities but is not a member of any club. This is unusual.');
        }
      } catch (err) {
        console.error('❌ [superUserUtils] Alternative method failed:', err);
      }
    }
    
    if (uniqueClubIds.length === 0) {
      console.warn('⚠️ [superUserUtils] No club IDs found. User may not be assigned to any club.');
      return [];
    }

    // IMPORTANT: Use club data we already have from studentApi.getClubs() instead of fetching again
    // SUPER_USER may not have permission to access /clubs/{id} endpoint (returns 500)
    console.log('🔍 [superUserUtils] Preparing club data for', uniqueClubIds.length, 'club(s)');
    
    let clubs: any[] = [];
    
    // If we have student clubs data, use it directly (avoids permission issues with clubApi.getById)
    if (studentClubsData.length > 0) {
      console.log('✅ [superUserUtils] Using club data from student membership (already fetched, avoiding permission issues)');
      
      // Create a map of club ID to club object for quick lookup
      const clubMap = new Map<number, any>();
      studentClubsData.forEach((club: any) => {
        const clubId = club.id || club.clubId;
        if (clubId != null) {
          clubMap.set(Number(clubId), club);
        }
      });
      
      // Get clubs that match our unique club IDs
      uniqueClubIds.forEach(clubId => {
        const club = clubMap.get(clubId);
        if (club) {
          clubs.push(club);
          console.log('✅ [superUserUtils] Using existing club data for club ID:', clubId, 'Name:', club.title || club.name);
        } else {
          console.warn('⚠️ [superUserUtils] Club ID', clubId, 'not found in student clubs data');
        }
      });
      
      console.log('✅ [superUserUtils] Successfully prepared', clubs.length, 'club(s) from membership data');
    } else {
      // No student clubs data available, try fetching directly (may fail for SUPER_USER)
      console.log('⚠️ [superUserUtils] No student clubs data available, fetching clubs directly (may fail for SUPER_USER)');
      const clubPromises = uniqueClubIds.map(async (clubId: number) => {
        try {
          const club = await clubApi.getById(clubId);
          console.log('✅ [superUserUtils] Successfully fetched club:', {
            id: club.id || club.clubId,
            name: club.title || club.name,
          });
          return club;
        } catch (err) {
          console.warn(`⚠️ [superUserUtils] Failed to fetch club ${clubId}:`, {
            error: err,
            message: err instanceof Error ? err.message : 'Unknown error',
            status: (err as any)?.status,
          });
          return null;
        }
      });
      clubs = (await Promise.all(clubPromises)).filter(Boolean);
    }
    
    console.log('✅ [superUserUtils] Successfully loaded', clubs.length, 'authorized club(s) out of', uniqueClubIds.length, 'requested');
    
    if (clubs.length === 0 && uniqueClubIds.length > 0) {
      console.error('❌ [superUserUtils] Found club IDs but failed to fetch any club details. This may indicate a backend issue.');
    }
    
    return clubs;
  } catch (error) {
    console.error('[superUserUtils] Failed to load authorized clubs:', error);
    return [];
  }
}

/**
 * Gets the user's position/authority name for a specific club
 * @param userId - The ID of the SUPER_USER
 * @param clubId - The ID of the club
 * @returns The authority name (e.g., "President", "Secretary") or null
 */
export async function getUserPositionForClub(userId: number, clubId: number): Promise<string | null> {
  if (!userId || !clubId) return null;

  try {
    const authoritiesRes = await authorityApi.getByStudent(userId).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
    const userAuthorities = extractCollection<any>(authoritiesRes) || [];

    // Find authority for this user and club
    const userAuth = userAuthorities.find((auth: any) => {
      const studentId = auth.student?.id || auth.studentId || auth.studentResponseDto?.id;
      const authClubId = auth.club?.id || auth.clubId || auth.club?.clubId;
      
      const matchesUser = studentId === userId || Number(studentId) === Number(userId);
      const matchesClub = authClubId != null && Number(authClubId) === Number(clubId);
      
      return matchesUser && matchesClub;
    });

    if (userAuth) {
      return userAuth.name || userAuth.authority || null;
    }

    return null;
  } catch (error) {
    console.error('[superUserUtils] Failed to get user position:', error);
    return null;
  }
}

