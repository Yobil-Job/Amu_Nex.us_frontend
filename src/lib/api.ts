// API Service Layer - Easy to modify base URL and endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Log API URL in development to verify environment variable is loaded
if (import.meta.env.DEV) {
  console.log('🔧 API Base URL:', API_BASE_URL);
  console.log('🌍 Environment:', import.meta.env.MODE);
}

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

// Helper function to handle API responses with enhanced error handling
const handleResponse = async (response: Response): Promise<any> => {
  // Handle network errors
  if (!response.ok) {
    let errorMessage = 'API request failed';
    let errorData = null;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
      } else {
        errorMessage = await response.text() || errorMessage;
      }
    } catch (parseError) {
      // If we can't parse the error, use status text
      errorMessage = response.statusText || errorMessage;
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401 && tokenRefreshCallback) {
      try {
        await tokenRefreshCallback();
        // Don't throw here - let the caller retry
        throw new ApiError('Token expired, please retry', 401, errorData);
      } catch (refreshError) {
        throw new ApiError('Authentication failed. Please login again.', 401, errorData);
      }
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      throw new ApiError('You do not have permission to perform this action.', 403, errorData);
    }

    // Handle 500 Internal Server Error
    if (response.status === 500) {
      throw new ApiError(
        errorMessage || 'Server error. Please try again later or contact support.',
        500,
        errorData
      );
    }

    // Handle CORS errors
    if (response.status === 0 || response.type === 'opaque') {
      throw new ApiError(
        'Network error: Unable to connect to the server. Please check if the backend is running and CORS is configured correctly.',
        0
      );
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  // Handle successful responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

// Helper function for authenticated requests with retry logic
const authFetch = async (url: string, options: RequestInit = {}, retry = true): Promise<Response> => {
  const token = getAuthToken();
  
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    // If 401 and we have a refresh callback, try to refresh and retry once
    if (response.status === 401 && retry && tokenRefreshCallback) {
      try {
        await tokenRefreshCallback();
        // Retry the request with new token
        const newToken = getAuthToken();
        const retryOptions: RequestInit = {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(newToken && { Authorization: `Bearer ${newToken}` }),
            ...options.headers,
          },
        };
        return fetch(url, retryOptions);
      } catch (refreshError) {
        // Refresh failed, return original response
        return response;
      }
    }
    
    return response;
  } catch (error) {
    // Network errors (CORS, connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'Network error: Unable to connect to the API server. Please ensure the backend is running on ' + API_BASE_URL,
        0
      );
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
    const response = await authFetch(`${API_BASE_URL}/clubs/${clubId}/requests/${studentId}/reject`, {
      method: 'PATCH',
    });
    return handleResponse(response);
  },

  assignClubAdmin: async (clubId: number, memberId: number) => {
    const response = await authFetch(`${API_BASE_URL}/clubs/${clubId}/assign-clubAdmin/${memberId}`, {
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
