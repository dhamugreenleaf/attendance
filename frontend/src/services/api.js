import axios from 'axios';
import { API_URL } from '../constants/api';
import { getToken, clearAuth } from '../utils/storage';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      // Handle 401 Unauthorized globally
      if (error.response.status === 401) {
        await clearAuth();
        // You could emit an event here to trigger navigation to login
      }
    }
    return Promise.reject(error);
  }
);

export default api;
