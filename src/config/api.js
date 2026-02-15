// API Configuration
// Centralized endpoint definitions to avoid hardcoding URLs throughout the application

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login/`,
    register: `${API_BASE_URL}/auth/register/`,
    logout: `${API_BASE_URL}/auth/logout/`,
    checkAuth: `${API_BASE_URL}/auth/me/`,
    csrf: `${API_BASE_URL}/auth/csrf/`,
  },

  devices: {
    list: `${API_BASE_URL}/devices/public/`,
    // Function to generate device-specific URLs with UUID
    detail: (id) => `${API_BASE_URL}/devices/${id}/`,
    certificate: (id) => `${API_BASE_URL}/devices/${id}/certificate/`,
  },
  
  // Participant's own devices (requires authentication)
  participantDevices: {
    list: `${API_BASE_URL}/devices/participant/`,
    detail: (id) => `${API_BASE_URL}/devices/participant/${id}/`,
    generateCertificate: (id) => `${API_BASE_URL}/devices/participant/${id}/generate-certificate/`,
    downloadCertificate: (id) => `${API_BASE_URL}/devices/participant/${id}/download-certificate/`,
    downloadPrivateKey: (id) => `${API_BASE_URL}/devices/participant/${id}/download-private-key/`,
    downloadCodeBundle: (id) => `${API_BASE_URL}/devices/participant/${id}/download-code/`,
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