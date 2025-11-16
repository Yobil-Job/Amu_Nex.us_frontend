import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, studentApi, setTokenRefreshCallback } from '@/lib/api';
import { extractUserFromToken } from '@/lib/jwt';
import { toast } from 'sonner';

interface User {
  id?: number;
  email?: string;
  firstname?: string;
  lastname?: string;
  role?: string;
  gender?: string;
  yearOfStay?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from /student/me endpoint
  // Falls back to JWT token decoding if endpoint fails (handles 500 errors)
  const fetchUserProfile = useCallback(async () => {
    const currentAccessToken = accessToken || localStorage.getItem('accessToken');
    
    try {
      // Try to fetch from /student/me endpoint
      const meResponse = await studentApi.getMe();
      
      // Backend returns: { principal, name, authorities } OR direct student object
      // Try multiple response structures
      let userData: User = {};
      
      // Helper function to normalize role (remove ROLE_ prefix if present, keep as uppercase)
      const normalizeRole = (role: string | undefined | null): string => {
        if (!role) return 'STUDENT';
        if (typeof role !== 'string') return 'STUDENT';
        // Remove ROLE_ prefix if present, then uppercase
        return role.replace(/^ROLE_/, '').toUpperCase();
      };

      // Strategy 1: Response has principal object
      if (meResponse.principal) {
        const principal = meResponse.principal;
        const name = meResponse.name; // This is the email
        const extractedRole = meResponse.authorities?.[0]?.authority || principal?.role || meResponse.role || 'STUDENT';
        userData = {
          email: name || principal?.username || principal?.email,
          role: normalizeRole(extractedRole),
          id: principal?.id || principal?.studentId,
          firstname: principal?.firstname || principal?.student?.firstname,
          lastname: principal?.lastname || principal?.student?.lastname,
          gender: principal?.gender || principal?.student?.gender,
          yearOfStay: principal?.yearOfStay || principal?.student?.yearOfStay,
          department: principal?.department || principal?.student?.department,
          ...principal, // Include any additional fields
        };
      }
      // Strategy 2: Response is direct Map (backend returns Map<String, Object>)
      // Backend /student/me returns: { id, email, firstname, lastname, gender, yearOfStay, department, role, etc. }
      // Note: Role comes as "ADMIN" exactly for club admin
      if (meResponse.id || meResponse.email) {
        userData = {
          email: meResponse.email,
          role: normalizeRole(meResponse.role),
          id: meResponse.id,
          firstname: meResponse.firstname,
          lastname: meResponse.lastname,
          gender: meResponse.gender,
          yearOfStay: meResponse.yearOfStay,
          department: meResponse.department,
          ...meResponse, // Include all fields from the map
        };
      }
      // Strategy 3: Response has student nested object
      else if (meResponse.student) {
        const student = meResponse.student;
        userData = {
          email: student.email || meResponse.email,
          role: normalizeRole(student.role || meResponse.role),
          id: student.id,
          firstname: student.firstname,
          lastname: student.lastname,
          gender: student.gender,
          yearOfStay: student.yearOfStay,
          department: student.department,
          ...student,
        };
      }

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error: any) {
      // Fallback: Extract user info from JWT token
      // JWT token contains role as "ADMIN" exactly for club admin
      if (currentAccessToken) {
        try {
          const tokenUser = extractUserFromToken(currentAccessToken);
          if (tokenUser && tokenUser.email) {
            // Role is already normalized in extractUserFromToken
            const fallbackUser: User = {
              email: tokenUser.email,
              id: tokenUser.id,
              role: tokenUser.role, // Already normalized (ADMIN, STUDENT, etc.)
            };
            
            setUser(fallbackUser);
            localStorage.setItem('user', JSON.stringify(fallbackUser));
            return fallbackUser;
          }
        } catch (tokenError) {
          // Failed to extract user from token
        }
      }
      
      // Final fallback: Use stored user data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.email) {
            setUser(parsedUser);
            return parsedUser;
          }
        } catch (e) {
          localStorage.removeItem('user');
        }
      }
      
      return null;
    }
  }, [accessToken]);

  const logout = useCallback(async () => {
    try {
      const currentRefreshToken = refreshToken || localStorage.getItem('refreshToken');
      if (currentRefreshToken) {
        try {
          await authApi.logout(currentRefreshToken);
        } catch (error) {
          // Continue with local logout even if API call fails
        }
      }
    } catch (error) {
      // Logout error
    } finally {
      // Clear all auth state
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
    }
  }, [refreshToken]);

  // Register token refresh callback with API layer
  const refreshAccessToken = useCallback(async () => {
    try {
      const currentRefreshToken = refreshToken || localStorage.getItem('refreshToken');
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await authApi.refresh(currentRefreshToken);
      
      setAccessToken(response.accessToken);
      localStorage.setItem('accessToken', response.accessToken);
      
      if (response.refreshToken) {
        setRefreshToken(response.refreshToken);
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      return response.accessToken;
    } catch (error) {
      // Clear tokens and logout on refresh failure
      await logout();
      throw error;
    }
  }, [refreshToken, logout]);

  // Register callback on mount and when refresh function changes
  useEffect(() => {
    setTokenRefreshCallback(refreshAccessToken);
  }, [refreshAccessToken]);

  useEffect(() => {
    // Check for stored tokens on mount and restore session
    const initializeAuth = async () => {
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('user');

      if (storedAccessToken && storedRefreshToken) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        
        // Restore user from storage
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch (e) {
            // Failed to parse stored user
          }
        }
        
        // Try to fetch fresh user profile (with JWT fallback)
        const profileUser = await fetchUserProfile();
        if (profileUser) {
          // Profile fetched successfully, update user
          setUser(profileUser);
        }
        // If fetchUserProfile returns null, continue with stored user
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchUserProfile]);

  const login = async (email: string, password: string) => {
    try {
      // Clear any existing tokens before login to prevent unique constraint violations
      // This handles cases where old refresh tokens exist in the database
      // We clear local tokens only (don't call logout API as it requires authentication)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);

      // Backend login response: { accessToken, refreshToken, role }
      // NO user object in response
      // Note: Role comes as "ADMIN" exactly for club admin (no ROLE_ prefix)
      const response = await authApi.login(email, password);
      
      // Store tokens
      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Normalize role (remove ROLE_ prefix if present, keep as uppercase)
      // Role comes as "ADMIN" exactly for club admin
      const normalizeRole = (role: string | undefined | null): string => {
        if (!role) return 'STUDENT';
        if (typeof role !== 'string') return 'STUDENT';
        return role.replace(/^ROLE_/, '').toUpperCase();
      };

      // Create temporary user object with role and email
      const tempUser: User = {
        email,
        role: normalizeRole(response.role),
      };
      
      setUser(tempUser);
      localStorage.setItem('user', JSON.stringify(tempUser));

      // Fetch full user profile from /student/me (with JWT fallback)
      // This won't throw errors, just uses fallbacks
      const profileUser = await fetchUserProfile();
      if (profileUser) {
        // Profile fetched successfully (either from API or JWT)
        setUser(profileUser);
      }
      // If fetchUserProfile returns null, we continue with tempUser already set

      toast.success('Login successful!');
    } catch (error: any) {
      // Handle specific database constraint violation error
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      const errorString = JSON.stringify(error).toLowerCase();
      const fullErrorText = `${errorMessage} ${errorString}`;
      
      // Check for constraint violation errors (multiple patterns)
      // This error occurs when backend tries to create a new refresh token but one already exists
      const isConstraintViolation = 
        errorMessage.includes('Unique index') || 
        errorMessage.includes('refresh_tokens') || 
        errorMessage.includes('STUDENT_ID') ||
        errorMessage.includes('23505') || // PostgreSQL unique violation code
        errorMessage.includes('UKCKMMP76WPKOE5BQK1A3PKA1HL') || // Specific constraint name from error
        fullErrorText.includes('unique index') ||
        fullErrorText.includes('refresh_tokens') ||
        fullErrorText.includes('constraint') ||
        fullErrorText.includes('23505');
      
      if (isConstraintViolation) {
        // This is a backend database constraint issue
        // The backend is trying to INSERT a new refresh token but one already exists
        // This requires a backend fix (should DELETE old token before INSERT, or use UPSERT)
        
        // Show helpful error message to user
        toast.error(
          'Login failed: Database constraint violation. An old session token exists for this account. ' +
          'Please contact your administrator to resolve this issue, or try again in a few minutes.',
          { duration: 8000 }
        );
        
        // Still clear local tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        
        // Create a more informative error for the caller
        const constraintError = new Error(
          'REFRESH_TOKEN_CONSTRAINT_VIOLATION: Backend database constraint violation. ' +
          'An old refresh token exists for this user. The backend needs to be fixed to delete old tokens before creating new ones.'
        );
        (constraintError as any).status = 409; // Conflict status code
        (constraintError as any).isConstraintViolation = true;
        throw constraintError;
      }
      
      // For other errors, show the actual error message
      // Check for authentication errors
      if (error.status === 401 || errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('credential')) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.status === 500) {
        toast.error('Server error. Please try again later or contact support.');
      } else {
        toast.error(errorMessage);
      }
      
      throw error;
    }
  };


  const value = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!accessToken,
    isLoading,
    login,
    logout,
    refreshAccessToken,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
