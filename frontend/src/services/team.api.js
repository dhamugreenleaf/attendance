import api from './api';

export const teamApi = {
  getTeams: async () => {
    const response = await api.get('/team');
    return response.data;
  },

  getTeamById: async (id) => {
    const response = await api.get(`/team/${id}`);
    return response.data;
  },

  createTeam: async (data) => {
    const response = await api.post('/team', data);
    return response.data;
  },

  updateTeam: async (id, data) => {
    const response = await api.put(`/team/${id}`, data);
    return response.data;
  },

  deleteTeam: async (id) => {
    const response = await api.delete(`/team/${id}`);
    return response.data;
  }
};
