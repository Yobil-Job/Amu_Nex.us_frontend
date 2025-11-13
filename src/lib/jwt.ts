/**
 * JWT Token Utilities
 * Helper functions to decode and extract data from JWT tokens
 */

/**
 * Decode JWT token without verification
 * Note: This only decodes the payload, does NOT verify the signature
 */
export function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      throw new Error('Invalid token format');
    }
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Extract user info from JWT token
 * Backend JWT contains: sub (email), id, role, iat, exp
 * Note: Role comes as "ADMIN" exactly (for club admin) - no ROLE_ prefix
 */
export function extractUserFromToken(token: string | null): {
  email?: string;
  id?: number;
  role?: string;
} | null {
  if (!token) return null;

  try {
    const decoded = decodeJwt(token);
    if (!decoded) return null;

    // Extract role - handle both "ADMIN" and "ROLE_ADMIN" formats
    let role = decoded.role;
    if (role && typeof role === 'string') {
      // Remove ROLE_ prefix if present, but keep the role name as-is
      role = role.replace(/^ROLE_/, '').toUpperCase();
    }

    if (import.meta.env.DEV) {
      console.log('🔐 JWT Token decoded:', {
        email: decoded.sub || decoded.email,
        id: decoded.id || decoded.studentId,
        rawRole: decoded.role,
        normalizedRole: role || 'STUDENT',
      });
    }

    return {
      email: decoded.sub || decoded.email,
      id: decoded.id || decoded.studentId,
      role: role || 'STUDENT',
    };
  } catch (error) {
    console.error('Failed to extract user from token:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;

  try {
    const decoded = decodeJwt(token);
    if (!decoded || !decoded.exp) return true;

    // Check if token is expired (with 60 second buffer)
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const buffer = 60 * 1000; // 60 seconds

    return currentTime >= (expirationTime - buffer);
  } catch (error) {
    console.error('Failed to check token expiration:', error);
    return true;
  }
}

