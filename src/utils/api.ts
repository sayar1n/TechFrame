import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-090ebd00`;

// Helper function to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Helper function for authenticated requests
async function authenticatedRequest(endpoint: string, accessToken: string, options: RequestInit = {}) {
  return apiRequest(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    },
  });
}

// Auth API
export const authAPI = {
  signup: async (email: string, password: string, name: string, role: string) => {
    return apiRequest('/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
  },
};

// Projects API
export const projectsAPI = {
  getAll: async (accessToken: string) => {
    return authenticatedRequest('/projects', accessToken);
  },
  
  create: async (accessToken: string, project: { name: string; description: string; startDate: string; endDate: string }) => {
    return authenticatedRequest('/projects', accessToken, {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },
};

// Defects API
export const defectsAPI = {
  getAll: async (accessToken: string) => {
    return authenticatedRequest('/defects', accessToken);
  },
  
  getById: async (accessToken: string, id: string) => {
    return authenticatedRequest(`/defects/${id}`, accessToken);
  },
  
  create: async (accessToken: string, defect: any) => {
    return authenticatedRequest('/defects', accessToken, {
      method: 'POST',
      body: JSON.stringify(defect),
    });
  },
  
  update: async (accessToken: string, id: string, updates: any) => {
    return authenticatedRequest(`/defects/${id}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  addComment: async (accessToken: string, id: string, comment: string) => {
    return authenticatedRequest(`/defects/${id}/comments`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },
};

// Analytics API
export const analyticsAPI = {
  getStats: async (accessToken: string) => {
    return authenticatedRequest('/analytics', accessToken);
  },
};

// Users API
export const usersAPI = {
  getAll: async (accessToken: string) => {
    return authenticatedRequest('/users', accessToken);
  },
  
  updateRole: async (accessToken: string, userId: string, role: string) => {
    return authenticatedRequest(`/users/${userId}/role`, accessToken, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },
};