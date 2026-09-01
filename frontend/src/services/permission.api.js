import api from './api';

export const permissionApi = {
  createPermission: async (data) => {
    const response = await api.post('/permissions', data);
    return response.data;
  },

  getMyPermissions: async () => {
    const response = await api.get('/permissions/my-requests');
    return response.data;
  },

  getPendingPermissions: async () => {
    const response = await api.get('/permissions/pending');
    return response.data;
  },

  updatePermissionStatus: async (id, data) => {
    const response = await api.put(`/permissions/${id}/status`, data);
    return response.data;
  }
};
