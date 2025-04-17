import { API_BASE_URL, handleResponse, getAuthHeaders } from './config';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  company_name?: string;
  position?: string;
  skills?: string[];
}

interface LoginData {
  email: string;
  password: string;
}

export const authApi = {
  registerRecruiter: async (data: RegisterData) => {
    const response = await fetch(`${API_BASE_URL}/register/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  registerCandidate: async (data: RegisterData) => {
    const response = await fetch(`${API_BASE_URL}/register/candidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  login: async (data: LoginData) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    if (result.token) {
      localStorage.setItem('authToken', result.token);
    }
    return result;
  },

  requestPasswordReset: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    return handleResponse(response);
  },

  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  logout: () => {
    localStorage.removeItem('authToken');
  },
}; 