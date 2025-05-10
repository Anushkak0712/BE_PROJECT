import { API_BASE_URL, handleResponse, getAuthHeaders } from './config';

interface JobData {
  title: string;
  description: string;
  company_name: string;
  questions: string[];
  requirements: string[];
  location: string;
}

interface JobFilters {
  location?: string;
  job_type?: string;
  company_name?: string;
}

export const jobApi = {
  createJob: async (data: JobData) => {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getJobs: async (filters: JobFilters = {}) => {
    const queryParams = new URLSearchParams(filters as Record<string, string>);
    const response = await fetch(`${API_BASE_URL}/jobs?${queryParams}`);
    return handleResponse(response);
  },

  saveJob: async (jobId: string) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  applyForJob: async (jobId: string, videoAnswers: File[]) => {
    const formData = new FormData();
    videoAnswers.forEach((video, index) => {
      formData.append(`video_${index}`, video);
    });

    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeaders().Authorization,
      },
      body: formData,
    });
    return handleResponse(response);
  },

  getApplications: async (jobId: string) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/applications`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateApplicationStatus: async (applicationId: string, status: string) => {
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  requestRevaluation: async (applicationId: string) => {
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/revaluate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getVideoUrl: (filename: string) => `${API_BASE_URL}/videos/${filename}`,
}; 