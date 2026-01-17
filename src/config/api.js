// API Configuration
// Centralized endpoint definitions to avoid hardcoding URLs throughout the application

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login/`,
    logout: `${API_BASE_URL}/auth/logout/`,
    checkAuth: `${API_BASE_URL}/auth/check/`,
  },

  devices: {
    list: `${API_BASE_URL}/devices/public/`,
    // Function to generate device-specific URLs with UUID
    detail: (id) => `${API_BASE_URL}/devices/${id}/`,
    certificate: (id) => `${API_BASE_URL}/devices/${id}/certificate/`,
  },

  dashboard: {
    stats: `${API_BASE_URL}/dashboard/stats/`,
  },

  messages: {
    list: `${API_BASE_URL}/messages/`,
  },
};

// Centralized HTTP status codes for consistent error handling
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

export default API_ENDPOINTS;