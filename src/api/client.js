import axios from 'axios';
import { API_ENDPOINTS, HTTP_STATUS } from '../config/api';

// Base axios instance configured for Django session authentication
const apiClient = axios.create({
  withCredentials: true, // Required for Django session cookies to be sent with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global response interceptor for authentication errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Redirect to login page if session expires
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Function to get CSRF token from Django cookie
function getCsrfToken() {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(name + '=')) {
      return trimmed.substring(name.length + 1);
    }
  }
  return null;
}

// Request interceptor to add CSRF token to mutation requests
apiClient.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }
  return config;
});

// API modules for different resource groups
export const authAPI = {
  getCsrf: () => apiClient.get(API_ENDPOINTS.auth.csrf),
  login: (credentials) => apiClient.post(API_ENDPOINTS.auth.login, credentials),
  checkAuth: () => apiClient.get(API_ENDPOINTS.auth.checkAuth),
  logout: () => apiClient.post(API_ENDPOINTS.auth.logout),
};

// Device management API
export const devicesAPI = {
  getDevices: () => apiClient.get(API_ENDPOINTS.devices.list),
  getDevice: (id) => apiClient.get(API_ENDPOINTS.devices.detail(id)),
  createDevice: (data) => apiClient.post(API_ENDPOINTS.devices.list, data),
  updateDevice: (id, data) => apiClient.patch(API_ENDPOINTS.devices.detail(id), data),
  deleteDevice: (id) => apiClient.delete(API_ENDPOINTS.devices.detail(id)),
  // Certificate download requires blob response type for binary file handling
  downloadCertificate: (id) => apiClient.get(API_ENDPOINTS.devices.certificate(id), {
    responseType: 'blob',
  }),
};

// Participant's own devices API (requires authentication)
export const participantDevicesAPI = {
  getMyDevices: () => apiClient.get(API_ENDPOINTS.participantDevices.list),
  getMyDevice: (id) => apiClient.get(API_ENDPOINTS.participantDevices.detail(id)),
  createDevice: (data) => apiClient.post(API_ENDPOINTS.participantDevices.list, data),
  updateDevice: (id, data) => apiClient.patch(API_ENDPOINTS.participantDevices.detail(id), data),
  revokeDevice: (id) => apiClient.delete(API_ENDPOINTS.participantDevices.detail(id)),
  generateCertificate: (id) => apiClient.post(API_ENDPOINTS.participantDevices.generateCertificate(id)),
  downloadCertificate: (id) => apiClient.get(API_ENDPOINTS.participantDevices.downloadCertificate(id), {
    responseType: 'blob',
  }),
  downloadPrivateKey: (id) => apiClient.get(API_ENDPOINTS.participantDevices.downloadPrivateKey(id), {
    responseType: 'blob',
  }),
};


// Dashboard statistics API
export const dashboardAPI = {
  getStats: () => apiClient.get(API_ENDPOINTS.dashboard.stats),
};

// Messages API
export const messagesAPI = {
  getMessages: (params) => apiClient.get(API_ENDPOINTS.messages.list, { params }),
};

export default apiClient;