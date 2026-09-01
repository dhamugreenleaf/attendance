import api from './api';

export const authApi = {
  login: async (credentials) => {
    // credentials expects { email, password }
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
