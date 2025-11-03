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
      console.log('📊 /student/me response:', JSON.stringify(meResponse, null, 2));
      
      // Backend returns: { principal, name, authorities } OR direct student object
      // Try multiple response structures
      let userData: User = {};
      
      // Strategy 1: Response has principal object
      if (meResponse.principal) {
        const principal = meResponse.principal;
        const name = meResponse.name; // This is the email
        userData = {
          email: name || principal?.username || principal?.email,
          role: meResponse.authorities?.[0]?.authority?.replace('ROLE_', '') || principal?.role || 'STUDENT',
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
      // Backend /student/me returns: { id, email, firstname, lastname, gender, yearOfStay, department, etc. }
      if (meResponse.id || meResponse.email) {
        userData = {
          email: meResponse.email,
          role: meResponse.role || 'STUDENT',
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
          role: student.role || meResponse.role || 'STUDENT',
          id: student.id,
          firstname: student.firstname,
          lastname: student.lastname,
          gender: student.gender,
          yearOfStay: student.yearOfStay,
          department: student.department,
          ...student,
        };
      }
      
      console.log('✅ Extracted user data:', userData);

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error: any) {
      // Log the error for debugging (backend lazy loading issue)
      if (error.status === 500) {
        console.warn('⚠️ Backend /student/me returned 500 (likely lazy loading issue). Using JWT fallback.');
      } else {
        console.warn('Failed to fetch user profile from /student/me:', error);
      }
      
      // Fallback: Extract user info from JWT token
      if (currentAccessToken) {
        try {
          const tokenUser = extractUserFromToken(currentAccessToken);
          if (tokenUser && tokenUser.email) {
            const fallbackUser: User = {
              email: tokenUser.email,
              id: tokenUser.id,
              role: tokenUser.role,
            };
            
            console.log('✅ Using JWT token data as fallback (user info extracted from token):', {
              email: fallbackUser.email,
              id: fallbackUser.id,
              role: fallbackUser.role
            });
            setUser(fallbackUser);
            localStorage.setItem('user', JSON.stringify(fallbackUser));
            return fallbackUser;
          } else {
            console.warn('⚠️ JWT token does not contain valid user data');
          }
        } catch (tokenError) {
          console.error('❌ Failed to extract user from token:', tokenError);
        }
      } else {
        console.warn('⚠️ No access token available for JWT fallback');
      }
      
      // Final fallback: Use stored user data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.email) {
            console.log('Using stored user data as fallback');
            setUser(parsedUser);
            return parsedUser;
          }
        } catch (e) {
          console.error('Invalid stored user data:', e);
          localStorage.removeItem('user');
        }
      }
      
      // If all else fails, don't throw - just log and continue
      console.error('Could not retrieve user profile from any source');
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
          console.error('Logout API error (non-critical):', error);
          // Continue with local logout even if API call fails
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
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
      console.error('Token refresh failed:', error);
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
            console.error('Failed to parse stored user:', e);
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
      console.log('🔐 Attempting login for:', email);
      const response = await authApi.login(email, password);
      console.log('✅ Login API response received:', { 
        hasAccessToken: !!response.accessToken, 
        hasRefreshToken: !!response.refreshToken, 
        role: response.role 
      });
      
      // Store tokens
      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Create temporary user object with role and email
      const tempUser: User = {
        email,
        role: response.role || 'STUDENT',
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
      // Log detailed error information for debugging
      console.error('❌ Login error details:', {
        message: error.message,
        status: error.status,
        fullError: error,
        stack: error.stack
      });

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
        console.warn('⚠️ Refresh token constraint violation detected.');
        console.warn('⚠️ Backend needs to delete old refresh token before creating new one.');
        
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
