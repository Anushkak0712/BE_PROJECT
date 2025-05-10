import axios from 'axios';
import { API_BASE_URL, getAuthToken } from './config';

const API_URL = 'http://localhost:5000/api';

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data;
  },

  registerRecruiter: async (data: {
    username: string;
    email: string;
    password: string;
    company_name: string;
    position: string;
  }) => {
    const response = await axios.post(`${API_URL}/register/recruiter`, data);
    return response.data;
  },

  registerCandidate: async (data: {
    username: string;
    email: string;
    password: string;
    skills: string[];
  }) => {
    const response = await axios.post(`${API_URL}/register/candidate`, data);
    return response.data;
  },

  getProfile: async (token: string) => {
    const response = await axios.get(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  requestPasswordReset: async (email: string) => {
    const response = await axios.post(`${API_URL}/request-password-reset`, { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await axios.post(`${API_URL}/reset-password`, {
      token,
      new_password: newPassword
    });
    return response.data;
  }
};

// Job API
export const jobAPI = {
  createJob: async (token: string, data: {
    title: string;
    description: string;
    company_name: string;
    questions: Array<{ question_text: string; time_limit: number }>;
    requirements: string[];
    location: string;
    salary_range?: string;
    job_type?: string;
  }) => {
    const response = await axios.post(`${API_URL}/jobs`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getJobs: async (filters?: {
    location?: string;
    job_type?: string;
    company_name?: string;
    recruiter_id?: string;
  }) => {
    const response = await axios.get(`${API_URL}/jobs`, { params: filters });
    return response.data;
  },

  getJobById: async (jobId: string) => {
    const response = await axios.get(`${API_URL}/jobs/${jobId}`);
    return response.data;
  },

  saveJob: async (token: string, jobId: string) => {
    const response = await axios.post(
      `${API_URL}/jobs/${jobId}/save`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  applyForJob: async (jobId: string, videos: File[], token: string) => {
    try {
      const formData = new FormData();
      
      // Use unique field names but preserve original filenames
      videos.forEach((video, index) => {
        formData.append(`video_${index}`, video, video.name);  // Keep video_${index} as field name but use original filename
      });

      const response = await axios.post(
        `${API_URL}/jobs/${jobId}/apply`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error in applyForJob:', error);
      if (error.response?.status === 401) {
        throw new Error('Invalid or expired token. Please log in again.');
      }
      throw new Error(error.response?.data?.message || 'Failed to submit application');
    }
  },

  getJobApplications: async (token: string, jobId: string, filters?: {
    status?: string;
    revaluation_status?: string;
  }) => {
    const response = await axios.get(`${API_URL}/jobs/${jobId}/applications`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    });
    return response.data;
  },

  updateApplicationStatus: async (token: string, applicationId: string, status: string) => {
    const response = await axios.put(
      `${API_URL}/applications/${applicationId}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  requestRevaluation: async (token: string, applicationId: string) => {
    const response = await axios.post(
      `${API_URL}/applications/${applicationId}/revaluate`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  getVideo: async (token: string, filename: string) => {
    const response = await axios.get(`${API_URL}/videos/${filename}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    });
    return response.data;
  },

  getCandidateApplications: async (token: string) => {
    const response = await axios.get(`${API_URL}/candidate/applications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

// Types
export interface Job {
  _id: string;
  title: string;
  description: string;
  company_name: string;
  questions: Array<{
    question_text: string;
    time_limit: number;
  }>;
  requirements: string[];
  location: string;
  salary_range?: string;
  job_type?: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  _id: string;
  job_id: string;
  candidate_id: string;
  answers: Array<{
    question_index: number;
    video_url: string;
    personality_scores: {
      extraversion: number;
      neuroticism: number;
      agreeableness: number;
      conscientiousness: number;
      openness: number;
    };
  }>;
  status: string;
  revaluation_status?: string;
  average_scores: {
    extraversion: number;
    neuroticism: number;
    agreeableness: number;
    conscientiousness: number;
    openness: number;
  };
  created_at: string;
  updated_at: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  user_type: 'recruiter' | 'candidate';
  company_name?: string;
  position?: string;
  skills?: string[];
} 