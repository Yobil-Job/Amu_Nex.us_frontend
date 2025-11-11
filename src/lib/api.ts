// API Service Layer - Easy to modify base URL and endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';


// Token refresh callback (set by AuthContext)
let tokenRefreshCallback: (() => Promise<void>) | null = null;

export const setTokenRefreshCallback = (callback: () => Promise<void>) => {
  tokenRefreshCallback = callback;
};

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Retry function for network errors and 5xx errors
const retryRequest = async (
  fn: () => Promise<Response>,
  retries = MAX_RETRIES
): Promise<Response> => {
  try {
    return await fn();
  } catch (error: any) {
    // Don't retry on client errors (4xx) except 401
    if (error?.status && error.status >= 400 && error.status < 500 && error.status !== 401) {
      throw error;
    }

    // Retry on network errors or 5xx errors
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryRequest(fn, retries - 1);
    }

    throw error;
  }
};

// Helper function to handle API responses with enhanced error handling
const handleResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let errorData: any = null;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        
        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((e: any) => 
            `${e.field}: ${e.message}`
          ).join(', ');
        }
      } else {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
    } catch (e) {
      // If parsing fails, use status-based messages
      if (response.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (response.status === 403) {
        errorMessage = 'Access denied. You do not have permission to perform this action.';
      } else if (response.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (response.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (response.status >= 400) {
        errorMessage = 'Request failed. Please check your input and try again.';
      }
    }

    if (import.meta.env.DEV) {
      console.error(`❌ API Error:`, { 
        url: response.url, 
        status: response.status, 
        message: errorMessage,
        data: errorData 
      });
    }
    throw new ApiError(errorMessage, response.status, errorData);
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const jsonData = await response.json();
    return jsonData;
  }
  const textData = await response.text();
  
  // Try to parse as JSON if it looks like JSON
  if (textData.trim().startsWith('{') || textData.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(textData);
      return parsed;
    } catch (e) {
      // If parsing fails, return as text
    }
  }
  
  return textData;
};

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

// Helper function for authenticated requests with retry logic
const authFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const accessToken = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  } as HeadersInit;

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  const makeRequest = () => fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  try {
    let response = await retryRequest(makeRequest);

    // Handle 401 with token refresh
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken && tokenRefreshCallback) {
        try {
          await tokenRefreshCallback();
          // Retry the original request with new token
          const newAccessToken = localStorage.getItem('accessToken');
          if (newAccessToken) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
            response = await retryRequest(() => fetch(url, {
              ...options,
              headers,
              credentials: 'include',
            }));
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          throw new ApiError('Session expired. Please login again.', 401);
        }
      } else {
        // No refresh token, redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw new ApiError('Authentication required. Please login again.', 401);
      }
    }

    return response;
  } catch (error: any) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new ApiError('Network error. Please check your connection and try again.', 0, { networkError: true });
    }
    throw error;
  }
};

// ============= AUTHENTICATION API =============
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  logout: async (refreshToken: string) => {
    const response = await authFetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    return handleResponse(response);
  },

  refresh: async (refreshToken: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    return handleResponse(response);
  },
};

// ============= STUDENT API =============
export const studentApi = {
  getMe: async () => {
    const response = await authFetch(`${API_BASE_URL}/student/me`);
    return handleResponse(response);
  },

  register: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getAll: async () => {
    const response = await authFetch(`${API_BASE_URL}/student/allstudents`);
    const data = await handleResponse(response);
    // HATEOAS: Extract from _embedded
    return data;
  },

  getById: async (id: number) => {
    const response = await authFetch(`${API_BASE_URL}/student/${id}`);
    return handleResponse(response);
  },

  update: async (id: number, data: any) => {
    const response = await authFetch(`${API_BASE_URL}/student/${id}/update`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id: number) => {
    const response = await authFetch(`${API_BASE_URL}/student/${id}/delete`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  getClubs: async (id: number) => {
    const response = await authFetch(`${API_BASE_URL}/student/${id}/getclubsJoined`);
    return handleResponse(response);
  },

  getEvents: async (id: number) => {
    const response = await authFetch(`${API_BASE_URL}/student/${id}/events`);
    return handleResponse(response);
  },

  requestToJoinClub: async (studentId: number, clubId: number) => {
    const response = await authFetch(`${API_BASE_URL}/student/${studentId}/clubs/${clubId}/request`, {
      method: 'POST',
    });
    return handleResponse(response);
  },
};

// ============= CLUB API =============
export const clubApi = {
  create: async (data: any) => {
    const response = await authFetch(`${API_BASE_URL}/clubs/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getAll: async () => {
    const response = await authFetch(`${API_BASE_URL}/clubs/all-clubs`);
    const data = await handleResponse(response);
    // HATEOAS: Extract from _embedded
    return data;
  },

  getById: async (id: number) => {
    const response = await authFetch(`${API_BASE_URL}/clubs/${id}`);
    return handleResponse(response);
  },

  update: async (id: number, data: any) => {
    const response = await authFetch(`${API_BASE_URL}/clubs/${id}/update`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id: number) => {
    const response = await authFetch(`${API_BASE_URL}/clubs/${id}/delete`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  getMembers: async (clubId: number) => {
    const response = await authFetch(`${API_BASE_URL}/clubs/${clubId}/get-members`);
    return handleResponse(response);
  },

  getPendingRequests: async (clubId: number) => {
    const response = await authFetch(`${API_BASE_URL}/clubs/${clubId}/requests/pending`);
    const data = await handleResponse(response);
    // HATEOAS: Extract from _embedded
    return data;
  },

  approveRequest: async (clubId: number, studentId: number) => {
    const response = await authFetch(`${API_BASE_URL}/clubs/${clubId}/requests/${studentId}/approve`, {
      method: 'PATCH',
    });
    return handleResponse(response);
  },

  rejectRequest: async (clubId: number, studentId: number) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/clubs/${clubId}/requests/${studentId}/reject`, {
        method: 'PATCH',
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('❌ rejectRequest API error:', {
        clubId,
        studentId,
        url: `${API_BASE_URL}/clubs/${clubId}/requests/${studentId}/reject`,
        error: error.message || error,
      });
      throw error;
    }
  },

  assignClubAdmin: async (clubId: number, memberId: number) => {
    const response = await authFetch(`${API_BASE_URL}/clubs/${clubId}/assign-clubAdmin/${memberId}`, {
      method: 'PATCH',
    });
    return handleResponse(response);
  },

  demoteClubAdmin: async (clubId: number, memberId: number) => {
    // Try to call the demote endpoint if it exists
    const response = await authFetch(`${API_BASE_URL}/clubs/${clubId}/demote-clubAdmin/${memberId}`, {
      method: 'PATCH',
    });
    return handleResponse(response);
  },
};

// ============= EVENT API =============
export const eventApi = {
  create: async (data: any) => {
    const response = await authFetch(`${API_BASE_URL}/events/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getAll: async () => {
    const response = await authFetch(`${API_BASE_URL}/events/allEvents`);
    const data = await handleResponse(response);
    // HATEOAS: Extract from _embedded
    return data;
  },

  getById: async (id: number) => {
    const response = await authFetch(`${API_BASE_URL}/events/${id}`);
    return handleResponse(response);
  },

  getByClub: async (clubId: number) => {
    const response = await authFetch(`${API_BASE_URL}/events/club/${clubId}`);
    return handleResponse(response);
  },

  update: async (id: number, data: any) => {
    const response = await authFetch(`${API_BASE_URL}/events/${id}/update`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id: number) => {
    const response = await authFetch(`${API_BASE_URL}/events/${id}/delete`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// ============= FEE API =============
export const feeApi = {
  record: async (clubId: number, studentId: number, data: any) => {
    const response = await authFetch(`${API_BASE_URL}/fees/clubs/${clubId}/fees/students/${studentId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getById: async (id: number) => {
    const response = await authFetch(`${API_BASE_URL}/fees/${id}`);
    return handleResponse(response);
  },

  getByStudent: async (studentId: number) => {
    const response = await authFetch(`${API_BASE_URL}/fees/students/${studentId}`);
    return handleResponse(response);
  },

  getByClub: async (clubId: number) => {
    const response = await authFetch(`${API_BASE_URL}/fees/clubs/${clubId}`);
    return handleResponse(response);
  },

  getTotalByClub: async (clubId: number) => {
    const response = await authFetch(`${API_BASE_URL}/fees/clubs/${clubId}/total`);
    return handleResponse(response);
  },

  updateStatus: async (feeId: number, status: string) => {
    const response = await authFetch(`${API_BASE_URL}/fees/${feeId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },
};

// ============= AUTHORITY API =============
export const authorityApi = {
  create: async (clubAdminId: number, data: any) => {
    const response = await authFetch(`${API_BASE_URL}/authorities/${clubAdminId}/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getById: async (id: number) => {
    const response = await authFetch(`${API_BASE_URL}/authorities/${id}`);
    return handleResponse(response);
  },

  getAll: async () => {
    // Note: Backend doesn't have /authorities/allAuthorities endpoint
    // So we'll aggregate authorities from all clubs
    // This is a client-side implementation that loads authorities for all clubs
    try {
      // First, get all clubs
      const clubsRes = await clubApi.getAll();
      const clubs = extractCollection<any>(clubsRes) || [];
      
      // Then, get authorities for each club
      const authoritiesPromises = clubs.map((club: any) =>
        authorityApi.getByClub(club.id).catch(() => ({ _embedded: { authorityResponseDtoList: [] } }))
      );
      
      const authoritiesArrays = await Promise.all(authoritiesPromises);
      const allAuthorities: any[] = [];
      
      authoritiesArrays.forEach((res: any) => {
        const authorities = extractCollection<any>(res) || [];
        allAuthorities.push(...authorities);
      });
      
      return { _embedded: { authorityResponseDtoList: allAuthorities } };
    } catch {
      return { _embedded: { authorityResponseDtoList: [] } };
    }
  },

  getByStudent: async (studentId: number) => {
    const response = await authFetch(`${API_BASE_URL}/authorities/students/${studentId}`);
    const data = await handleResponse(response);
    // HATEOAS: Extract from _embedded
    return data;
  },

  getByClub: async (clubId: number) => {
    const response = await authFetch(`${API_BASE_URL}/authorities/clubs/${clubId}`);
    const data = await handleResponse(response);
    // HATEOAS: Extract from _embedded
    return data;
  },

  update: async (authorityId: number, clubAdminId: number, data: any) => {
    const response = await authFetch(`${API_BASE_URL}/authorities/${authorityId}/update/${clubAdminId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (authorityId: number, clubId: number, clubAdminId: number) => {
    const response = await authFetch(`${API_BASE_URL}/authorities/${authorityId}/delete/${clubId}/${clubAdminId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

// ============= ANNOUNCEMENT API =============
export const announcementApi = {
  create: async (data: any) => {
    const response = await authFetch(`${API_BASE_URL}/announcements/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getAll: async () => {
    const response = await authFetch(`${API_BASE_URL}/announcements/retriveAllAnnouncement`);
    const data = await handleResponse(response);
    // HATEOAS: Extract from _embedded
    return data;
  },

  getById: async (id: number) => {
    const response = await authFetch(`${API_BASE_URL}/announcements/${id}`);
    return handleResponse(response);
  },

  getByClub: async (clubId: number) => {
    const response = await authFetch(`${API_BASE_URL}/announcements/retriveAnnouncementByClub/${clubId}`);
    return handleResponse(response);
  },

  update: async (id: number, data: any) => {
    const response = await authFetch(`${API_BASE_URL}/announcements/${id}/update`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (announcementId: number, createdById: number) => {
    const response = await authFetch(`${API_BASE_URL}/announcements/${announcementId}/${createdById}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};
