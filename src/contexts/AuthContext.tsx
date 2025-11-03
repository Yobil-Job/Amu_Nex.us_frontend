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
      
      // Backend returns: { principal, name, authorities }
      // We need to extract user info from principal
      const principal = meResponse.principal;
      const name = meResponse.name; // This is the email
      
      // If principal is CustomUserDetails, it has student info
      // Otherwise, we construct from available data
      const userData: User = {
        email: name || principal?.username || principal?.email,
        role: meResponse.authorities?.[0]?.authority?.replace('ROLE_', '') || principal?.role || 'STUDENT',
        id: principal?.id || principal?.studentId,
        firstname: principal?.firstname || principal?.student?.firstname,
        lastname: principal?.lastname || principal?.student?.lastname,
        gender: principal?.gender || principal?.student?.gender,
        yearOfStay: principal?.yearOfStay || principal?.student?.yearOfStay,
        ...principal, // Include any additional fields
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error: any) {
      console.warn('Failed to fetch user profile from /student/me:', error);
      
      // Fallback: Extract user info from JWT token
      if (currentAccessToken) {
        try {
          const tokenUser = extractUserFromToken(currentAccessToken);
          if (tokenUser) {
            const fallbackUser: User = {
              email: tokenUser.email,
              id: tokenUser.id,
              role: tokenUser.role,
            };
            
            console.log('Using JWT token data as fallback:', fallbackUser);
            setUser(fallbackUser);
            localStorage.setItem('user', JSON.stringify(fallbackUser));
            return fallbackUser;
          }
        } catch (tokenError) {
          console.error('Failed to extract user from token:', tokenError);
        }
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
      // Backend login response: { accessToken, refreshToken, role }
      // NO user object in response
      const response = await authApi.login(email, password);
      
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
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
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
