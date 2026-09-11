import api from './api';

export const authApi = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  signup: async (data) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  verifyOtp: async (data) => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  forceChangePassword: async (data) => {
    const payload = typeof data === 'string' ? { newPassword: data } : data;
    const response = await api.post('/auth/force-change-password', payload);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/update-profile', data);
    return response.data;
  },
};
