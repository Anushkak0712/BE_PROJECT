// Base URL for API calls
export const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to handle API responses
export const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

// Get auth token from localStorage
export const getAuthToken = () => localStorage.getItem('authToken');

// Headers with auth token
export const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json',
}); 