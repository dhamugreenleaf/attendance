import api from './api';

export const leaveApi = {
  createLeave: async (data) => {
    const response = await api.post('/leaves', data);
    return response.data;
  },

  getMyLeaves: async () => {
    const response = await api.get('/leaves/my-requests');
    return response.data;
  },

  getPendingLeaves: async () => {
    const response = await api.get('/leaves/pending');
    return response.data;
  },

  updateLeaveStatus: async (id, data) => {
    const response = await api.put(`/leaves/${id}/status`, data);
    return response.data;
  }
};
