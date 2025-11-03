// API Service Layer - Easy to modify base URL and endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Log API URL in development to verify environment variable is loaded
if (import.meta.env.DEV) {
  console.log('🔧 API Base URL:', API_BASE_URL);
  console.log('🌍 Environment:', import.meta.env.MODE);
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'API request failed');
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem('accessToken');

// Helper function for authenticated requests
const authFetch = (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
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
    return handleResponse(response);
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
    return handleResponse(response);
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
    return handleResponse(response);
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
    return handleResponse(response);
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
    return handleResponse(response);
  },

  getByClub: async (clubId: number) => {
    const response = await authFetch(`${API_BASE_URL}/authorities/clubs/${clubId}`);
    return handleResponse(response);
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
    return handleResponse(response);
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
