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

// API modules for different resource groups
export const authAPI = {
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

// Dashboard statistics API
export const dashboardAPI = {
  getStats: () => apiClient.get(API_ENDPOINTS.dashboard.stats),
};

// Messages API
export const messagesAPI = {
  getMessages: (params) => apiClient.get(API_ENDPOINTS.messages.list, { params }),
};

export default apiClient;