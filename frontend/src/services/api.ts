import axios from 'axios';

const API_BASE_URL = 'http://localhost:8003';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth interfaces
export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  display_name?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  full_name?: string;
  display_name?: string;
  profile_image?: string;
  email_verified: boolean;
  created_at: string;
  last_login?: string;
  login_count: number;
  content_extraction_count: number;
  last_content_extraction?: string;
}

export interface UserUpdate {
  full_name?: string;
  display_name?: string;
  profile_image?: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  new_password: string;
}

// Auth API functions
export const login = async (data: LoginData) => {
  const formData = new FormData();
  formData.append('username', data.username);
  formData.append('password', data.password);
  
  const response = await api.post('/api/auth/token', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const registerUser = async (data: RegisterData) => {
  const response = await api.post('/api/auth/register', data);
  return response.data;
};

export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get('/api/auth/profile');
  return response.data;
};

export const updateUserProfile = async (data: UserUpdate) => {
  const response = await api.put('/api/auth/profile', data);
  return response.data;
};

export const changePassword = async (data: PasswordChange) => {
  const response = await api.post('/api/auth/change-password', data);
  return response.data;
};

export const requestPasswordReset = async (data: PasswordResetRequest) => {
  const response = await api.post('/api/auth/request-password-reset', data);
  return response.data;
};

export const resetPassword = async (data: PasswordReset) => {
  const response = await api.post('/api/auth/reset-password', data);
  return response.data;
};

export const deleteAccount = async () => {
  const response = await api.delete('/api/auth/account');
  return response.data;
};

// User stats and activity
export const getUserStats = async () => {
  const response = await api.get('/api/users/stats');
  return response.data;
};

export const getUserActivity = async (days: number = 30) => {
  const response = await api.get(`/api/users/activity?days=${days}`);
  return response.data;
};

// Content API functions
export const extractContent = async (url: string) => {
  const response = await api.post('/api/content/extract', { url });
  return response.data;
};

export const getContents = async () => {
  const response = await api.get('/api/content/');
  return response.data;
};

export const getContent = async (id: number) => {
  const response = await api.get(`/api/content/${id}`);
  return response.data;
};

export const deleteContent = async (id: number) => {
  const response = await api.delete(`/api/content/${id}`);
  return response.data;
};

// Settings API functions
export const getApiKeyStatus = async () => {
  const response = await api.get('/api/settings/api-key-status');
  return response.data;
};

export const testApiKey = async (apiKey: string) => {
  const response = await api.post('/api/settings/api-key/test', { api_key: apiKey });
  return response.data;
};

export const setApiKey = async (apiKey: string) => {
  const response = await api.post('/api/settings/api-key/set', { api_key: apiKey });
  return response.data;
};

export const deleteApiKey = async () => {
  const response = await api.delete('/api/settings/api-key');
  return response.data;
};

export default api;
