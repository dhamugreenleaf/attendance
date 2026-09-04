import api from './api';

export const departmentApi = {
  getDepartments: async () => {
    const response = await api.get('/departments');
    return response.data;
  },
  getDepartmentById: async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },
};
