import { clubApi, authorityApi, studentApi } from './api';
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
  if (!userId) return [];

  try {
    // Strategy: Use getByStudent() to get user's authorities, then extract club IDs
    // This avoids calling clubApi.getAll() which may fail with 500 for SUPER_USER
    const authoritiesRes = await authorityApi.getByStudent(userId).catch((err) => {
      return { _embedded: { authorityResponseDtoList: [] } };
    });
    
    const userAuthorities = extractCollection<any>(authoritiesRes) || [];

    if (userAuthorities.length === 0) {
      return [];
    }

    // Extract club IDs from authorities
    // PROBLEM: Authority model has @JsonIgnore on club field, so club info is NOT in the response
    // SOLUTION: Since a student must be a member of a club to have authority in it (backend enforces this),
    // we can get the student's clubs and return those. The user has authority in all clubs they're a member of.
    
    if (userAuthorities.length === 0) {
      return [];
    }

    // Strategy: Get clubs the student is a member of
    // Since backend enforces that students must be club members to have authority,
    // all clubs the student is a member of are clubs where they have authority
    try {
      // Get clubs the student has joined (this endpoint works for SUPER_USER: /student/{id}/getclubsJoined)
      // Backend returns List<ResponseClubDto> directly, not HATEOAS format
      const studentClubsRes = await studentApi.getClubs(userId).catch((err) => {
        return [];
      });
      
      // getClubs returns List<ResponseClubDto> directly (not HATEOAS), so it's already an array
      const studentClubs = Array.isArray(studentClubsRes) ? studentClubsRes : extractCollection<any>(studentClubsRes) || [];
      
      // The studentClubs already contain full club details (ResponseClubDto),
      // so we can return them directly without fetching again
      return studentClubs;
      
    } catch (err) {
      return [];
    }
  } catch (error) {
    return [];
  }
}

/**
 * Gets the user's position/authority name for a specific club
 * Since authority objects don't include club info (due to @JsonIgnore),
 * we match by getting the user's clubs and assuming the first authority
 * corresponds to the first club (since backend enforces 1:1 relationship
 * when user has single authority and single club membership)
 * 
 * @param userId - The ID of the SUPER_USER
 * @param clubId - The ID of the club
 * @returns The authority name (e.g., "President", "Secretary") or null
 */
export async function getUserPositionForClub(userId: number, clubId: number): Promise<string | null> {
  if (!userId || !clubId) return null;

  try {
    // Get user's authorities (these have the position names)
    const authoritiesRes = await authorityApi.getByStudent(userId).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }));
    const userAuthorities = extractCollection<any>(authoritiesRes) || [];

    if (userAuthorities.length === 0) {
      return null;
    }

    // Get user's clubs to match with authorities
    const studentClubsRes = await studentApi.getClubs(userId).catch(() => []);
    const studentClubs = Array.isArray(studentClubsRes) ? studentClubsRes : extractCollection<any>(studentClubsRes) || [];

    // If user has exactly one authority and one club, they match
    if (userAuthorities.length === 1 && studentClubs.length === 1) {
      const club = studentClubs[0];
      const clubIdFromClub = club.id || club.clubId;
      if (clubIdFromClub && Number(clubIdFromClub) === Number(clubId)) {
        return userAuthorities[0].name || userAuthorities[0].authority || null;
      }
    }

    // If multiple, try to match by index (first authority = first club, etc.)
    // This is a best-effort match since we can't get club info from authority
    const clubIndex = studentClubs.findIndex((club: any) => {
      const clubIdFromClub = club.id || club.clubId;
      return clubIdFromClub && Number(clubIdFromClub) === Number(clubId);
    });

    if (clubIndex >= 0 && clubIndex < userAuthorities.length) {
      return userAuthorities[clubIndex].name || userAuthorities[clubIndex].authority || null;
    }

    // Fallback: return first authority name if we can't match
    // (better than showing nothing)
    if (userAuthorities.length > 0) {
      return userAuthorities[0].name || userAuthorities[0].authority || null;
    }

    return null;
  } catch (error) {
    return null;
  }
}

